import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface GrafanaAlert {
  id: number;
  uid: string;
  orgID: number;
  folderUID: string;
  ruleGroup: string;
  title: string;
  condition: string;
  data: any[];
  updated: string;
  noDataState: 'NoData' | 'Alerting' | 'OK';
  execErrState: 'Alerting' | 'OK';
  for: string;
  annotations: Record<string, string>;
  labels: Record<string, string>;
  isPaused: boolean;
}

export interface DisplayAlert {
  id: number;
  uid: string;
  name: string;
  state: 'alerting' | 'pending' | 'ok' | 'paused' | 'no_data';
  newStateDate: string;
  url: string;
  ruleGroup: string;
  folderUID: string;
  labels: Record<string, string>;
  alerts?: Array<{
    labels: Record<string, string>;
    annotations: Record<string, string>;
    state: 'Alerting' | 'Normal';
    activeAt: string;
    value: string;
  }>;
  totals?: {
    alerting: number;
    normal: number;
  };
  annotations: Record<string, string>;
  isSilenced?: boolean;
  instanceName?: string;
}

export interface GrafanaSilence {
  id: string;
  matchers: Array<{
    name: string;
    value: string;
    isRegex: boolean;
  }>;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  comment: string;
  status: {
    state: string;
  };
}

export interface AlertmanagerAlert {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt: string;
  updatedAt: string;
  fingerprint: string;
  receivers: Array<{ name: string }>;
  status: {
    state: 'unprocessed' | 'active' | 'suppressed';
    silencedBy: string[];
    inhibitedBy: string[];
  };
}

export interface PrometheusRule {
  name: string;
  query: string;
  duration: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  state: 'firing' | 'pending' | 'inactive';
  health: string;
  lastError?: string;
  evaluationTime: number;
  lastEvaluation: string;
  totals: {
    alerting: number;
    normal: number;
  };
  alerts?: Array<{
    labels: Record<string, string>;
    annotations: Record<string, string>;
    state: 'Alerting' | 'Normal';
    activeAt: string;
    value: string;
  }>;
}

export interface PrometheusRuleGroup {
  name: string;
  file: string;
  rules: PrometheusRule[];
  interval: number;
  limit: number;
  evaluationTime: number;
  lastEvaluation: string;
}

export interface PrometheusRulesResponse {
  status: string;
  data: {
    groups: PrometheusRuleGroup[];
  };
}

@Injectable()
export class GrafanaService {
  private readonly logger = new Logger(GrafanaService.name);
  private readonly instances: Array<{
    name: string;
    url: string;
    axiosInstance: AxiosInstance;
  }> = [];

  constructor(private configService: ConfigService) {
    this.initializeInstances();
  }

  private initializeInstances() {
    const instancesConfig = this.configService.get<string>('GRAFANA_INSTANCES');
    
    if (!instancesConfig) {
      this.logger.error('GRAFANA_INSTANCES environment variable is required. Format: JSON array [{"name":"...","url":"...","apiKey":"..."}]');
      return;
    }

    try {
      // Parse JSON format: [{"name":"default","url":"http://...","apiKey":"..."}]
      const instances: Array<{ name: string; url: string; apiKey: string }> = JSON.parse(instancesConfig);
      
      if (!Array.isArray(instances)) {
        this.logger.error('GRAFANA_INSTANCES must be a JSON array');
        return;
      }

      instances.forEach((config, index) => {
        if (!config.name || !config.url || !config.apiKey) {
          this.logger.warn(`Invalid Grafana instance configuration at index ${index}: missing required fields (name, url, apiKey)`);
          return;
        }

        this.instances.push({
          name: config.name.trim(),
          url: config.url.trim(),
          axiosInstance: axios.create({
            baseURL: config.url.trim(),
            headers: {
              Authorization: `Bearer ${config.apiKey.trim()}`,
              'Content-Type': 'application/json',
            },
          }),
        });
        this.logger.log(`Initialized Grafana instance: ${config.name} (${config.url})`);
      });

      if (this.instances.length === 0) {
        this.logger.error('No valid Grafana instances configured');
      }
    } catch (error) {
      this.logger.error(
        `Failed to parse GRAFANA_INSTANCES JSON: ${error.message}\n` +
        `Expected format: [{"name":"default","url":"https://grafana.example.com","apiKey":"glsa_xxx"}]`
      );
    }
  }

  private transformAlertToDisplay(
    alert: GrafanaAlert,
    instanceName: string,
    instanceUrl: string,
    prometheusRule?: PrometheusRule
  ): DisplayAlert {
    // Determine state based on actual Prometheus rule state if available
    let state: DisplayAlert['state'] = 'ok';
    let stateDate = alert.updated;
    
    if (alert.isPaused) {
      state = 'paused';
    } else if (prometheusRule) {
      // Use actual state from Prometheus API
      if (prometheusRule.state === 'firing') {
        state = 'alerting';
        // Use first alert's activeAt if available
        if (prometheusRule.alerts && prometheusRule.alerts.length > 0) {
          stateDate = prometheusRule.alerts[0].activeAt;
        }
      } else if (prometheusRule.state === 'pending') {
        state = 'pending';
        if (prometheusRule.alerts && prometheusRule.alerts.length > 0) {
          stateDate = prometheusRule.alerts[0].activeAt;
        }
      } else if (prometheusRule.state === 'inactive') {
        state = 'ok';
      }
    }
    
    return {
      id: alert.id,
      uid: alert.uid,
      name: alert.title,
      state,
      newStateDate: stateDate,
      url: `${instanceUrl}/alerting/grafana/${alert.uid}/view`,
      ruleGroup: alert.ruleGroup,
      folderUID: alert.folderUID,
      alerts: prometheusRule?.alerts,
      totals: prometheusRule?.totals,
      labels: alert.labels || {},
      annotations: alert.annotations || {},
      instanceName,
    };
  }

  async getSilences(): Promise<DisplayAlert[]> {
    const allAlerts: DisplayAlert[] = [];

    // Fetch alerts from all instances in parallel
    const instancePromises = this.instances.map(async (instance) => {
      const endpoint = '/api/v1/provisioning/alert-rules';
      const fullUrl = `${instance.url}${endpoint}`;
      
      try {
        this.logger.debug(`Fetching alerts from ${instance.name}: ${fullUrl}`);
        const [alertsResponse, alertmanagerAlerts, prometheusRules] = await Promise.all([
          instance.axiosInstance.get(endpoint),
          this.getAlertmanagerAlertsForInstance(instance),
          this.getPrometheusRulesForInstance(instance),
        ]);
        
        const alerts: GrafanaAlert[] = alertsResponse.data || [];
        this.logger.log(`Successfully fetched ${alerts.length} alert rules, ${alertmanagerAlerts.size} alertmanager alerts, and ${prometheusRules.size} Prometheus rules from ${instance.name}`);
        
        // Transform to display format and mark silenced alerts
        return alerts.map(alert => {
          const prometheusRule = prometheusRules.get(alert.title);
          const alertmanagerAlert = alertmanagerAlerts.get(alert.title);
          const displayAlert = this.transformAlertToDisplay(alert, instance.name, instance.url, prometheusRule);
          // Check if alert is silenced from alertmanager data
          displayAlert.isSilenced = alertmanagerAlert?.status?.silencedBy?.length > 0 || false;
          return displayAlert;
        });
      } catch (error) {
        this.logger.error(
          `Failed to fetch alert rules from ${instance.name}\n` +
          `  URL: ${fullUrl}\n` +
          `  Status: ${error.response?.status || 'N/A'}\n` +
          `  Status Text: ${error.response?.statusText || 'N/A'}\n` +
          `  Error Message: ${error.message}\n` +
          `  Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}\n` +
          `. API Key: ${instance.axiosInstance.defaults.headers['Authorization']}\n` +
          `  Hint: Make sure you are using the Grafana Alerting Provisioning API`
        );
        // Return empty array for this instance on error
        return [];
      }
    });

    const instanceResults = await Promise.all(instancePromises);
    instanceResults.forEach(alerts => allAlerts.push(...alerts));

    this.logger.log(`Total alerts from all instances: ${allAlerts.length}`);
    return allAlerts;
  }

  private async getPrometheusRulesForInstance(instance: { name: string; url: string; axiosInstance: AxiosInstance }): Promise<Map<string, PrometheusRule>> {
    // Try both API endpoints - newer versions use prometheus, older versions use ruler
    const endpoints = [
      '/api/prometheus/grafana/api/v1/rules',
      '/api/ruler/grafana/api/v1/rules?subtype=cortex'
    ];
    
    for (const endpoint of endpoints) {
      const fullUrl = `${instance.url}${endpoint}`;
      
      try {
        this.logger.debug(`Fetching Prometheus rules from ${instance.name}: ${fullUrl}`);
        const response = await instance.axiosInstance.get(endpoint);
        
        // Handle Prometheus API response format
        let groups: PrometheusRuleGroup[] = [];
        if (response.data.status === 'success' && response.data.data?.groups) {
          groups = response.data.data.groups;
        } else if (Array.isArray(response.data)) {
          // Ruler API might return array directly
          groups = response.data;
        }
        
        // Create map of rules by alert name for quick lookup
        const rulesMap = new Map<string, PrometheusRule>();
        groups.forEach(group => {
          group.rules?.forEach(rule => {
            if (rule.name) {
              rulesMap.set(rule.name, rule);
            }
          });
        });
        
        this.logger.log(`Successfully fetched ${rulesMap.size} Prometheus rules from ${instance.name} using ${endpoint}`);
        return rulesMap;
      } catch (error) {
        this.logger.debug(
          `Failed to fetch Prometheus rules from ${endpoint} on ${instance.name}: ${error.message}`
        );
        // Continue to next endpoint
      }
    }
    
    this.logger.warn(`Could not fetch Prometheus rules from ${instance.name} using any endpoint (non-critical)`);
    return new Map();
  }

  private async getAlertmanagerAlertsForInstance(instance: { name: string; url: string; axiosInstance: AxiosInstance }): Promise<Map<string, AlertmanagerAlert>> {
    const endpoint = '/api/alertmanager/grafana/api/v2/alerts';
    const fullUrl = `${instance.url}${endpoint}`;
    
    try {
      this.logger.debug(`Fetching alertmanager alerts from ${instance.name}: ${fullUrl}`);
      const response = await instance.axiosInstance.get(endpoint);
      const alerts: AlertmanagerAlert[] = response.data || [];
      
      // Create map by alert rule name (alertname label)
      const alertsMap = new Map<string, AlertmanagerAlert>();
      alerts.forEach(alert => {
        const alertName = alert.labels.alertname;
        if (alertName) {
          alertsMap.set(alertName, alert);
        }
      });
      
      this.logger.log(`Successfully fetched ${alerts.length} alertmanager alerts from ${instance.name}`);
      return alertsMap;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch alertmanager alerts from ${instance.name} (non-critical)\n` +
        `  URL: ${fullUrl}\n` +
        `  Status: ${error.response?.status || 'N/A'}\n` +
        `  Error Message: ${error.message}`
      );
      return new Map();
    }
  }

  private async getSilencesForInstance(instance: { name: string; url: string; axiosInstance: AxiosInstance }): Promise<GrafanaSilence[]> {
    const endpoint = '/api/alertmanager/grafana/api/v2/silences';
    const fullUrl = `${instance.url}${endpoint}`;
    
    try {
      this.logger.debug(`Fetching silences from ${instance.name}: ${fullUrl}`);
      const response = await instance.axiosInstance.get(endpoint);
      const silences: GrafanaSilence[] = response.data || [];
      
      // Filter only active silences
      const now = new Date();
      const activeSilences = silences.filter(silence => {
        const startsAt = new Date(silence.startsAt);
        const endsAt = new Date(silence.endsAt);
        return silence.status?.state === 'active' && startsAt <= now && endsAt >= now;
      });
      
      this.logger.log(`Successfully fetched ${activeSilences.length} active silences from ${instance.name}`);
      return activeSilences;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch silences from ${instance.name} (non-critical)\n` +
        `  URL: ${fullUrl}\n` +
        `  Status: ${error.response?.status || 'N/A'}\n` +
        `  Error Message: ${error.message}`
      );
      // Return empty array if silences can't be fetched (non-critical)
      return [];
    }
  }

  async getAlerts(): Promise<DisplayAlert[]> {
    return this.getSilences();
  }

  async getAlertById(id: number): Promise<GrafanaAlert> {
    // Search across all instances
    for (const instance of this.instances) {
      const endpoint = `/api/v1/provisioning/alert-rules/${id}`;
      const fullUrl = `${instance.url}${endpoint}`;
      
      try {
        this.logger.debug(`Fetching alert ${id} from ${instance.name}: ${fullUrl}`);
        const response = await instance.axiosInstance.get(endpoint);
        this.logger.log(`Successfully fetched alert ${id} from ${instance.name}`);
        return response.data;
      } catch (error) {
        // Continue to next instance if not found
        if (error.response?.status === 404) {
          continue;
        }
        this.logger.error(
          `Failed to fetch alert ${id} from ${instance.name}\n` +
          `  URL: ${fullUrl}\n` +
          `  Status: ${error.response?.status || 'N/A'}\n` +
          `  Status Text: ${error.response?.statusText || 'N/A'}\n` +
          `  Error Message: ${error.message}\n` +
          `  Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}`
        );
      }
    }
    throw new Error(`Alert ${id} not found in any Grafana instance`);
  }

  async pauseAlert(uid: string): Promise<void> {
    // Search across all instances
    for (const instance of this.instances) {
      const endpoint = `/api/v1/provisioning/alert-rules/${uid}`;
      const fullUrl = `${instance.url}${endpoint}`;
      
      try {
        this.logger.debug(`Pausing alert ${uid} at ${instance.name}: ${fullUrl}`);
        // First get the alert
        const alert = await instance.axiosInstance.get(endpoint);
        // Then update it with isPaused: true
        await instance.axiosInstance.put(endpoint, {
          ...alert.data,
          isPaused: true,
        });
        this.logger.log(`Alert ${uid} paused successfully on ${instance.name}`);
        return;
      } catch (error) {
        // Continue to next instance if not found
        if (error.response?.status === 404) {
          continue;
        }
        this.logger.error(
          `Failed to pause alert ${uid} on ${instance.name}\n` +
          `  URL: ${fullUrl}\n` +
          `  Status: ${error.response?.status || 'N/A'}\n` +
          `  Status Text: ${error.response?.statusText || 'N/A'}\n` +
          `  Error Message: ${error.message}\n` +
          `  Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}`
        );
      }
    }
    throw new Error(`Alert ${uid} not found in any Grafana instance`);
  }
}
