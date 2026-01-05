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

  private transformAlertToDisplay(alert: GrafanaAlert, instanceName: string, instanceUrl: string): DisplayAlert {
    // Determine state based on Grafana alert rule properties
    let state: DisplayAlert['state'] = 'ok';
    
    if (alert.isPaused) {
      state = 'paused';
    } else if (alert.noDataState === 'Alerting') {
      state = 'no_data';
    } else if (alert.execErrState === 'Alerting') {
      state = 'alerting';
    }
    // Note: Grafana alert rules don't have real-time state in the provisioning API
    // You may need to use the alertmanager API for actual firing alerts
    
    return {
      id: alert.id,
      uid: alert.uid,
      name: alert.title,
      state,
      newStateDate: alert.updated,
      url: `${instanceUrl}/alerting/grafana/${alert.uid}/view`,
      ruleGroup: alert.ruleGroup,
      folderUID: alert.folderUID,
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
        const [alertsResponse, silences] = await Promise.all([
          instance.axiosInstance.get(endpoint),
          this.getSilencesForInstance(instance),
        ]);
        
        const alerts: GrafanaAlert[] = alertsResponse.data || [];
        this.logger.log(`Successfully fetched ${alerts.length} alert rules and ${silences.length} active silences from ${instance.name}`);
        
        // Transform to display format and mark silenced alerts
        return alerts.map(alert => {
          const displayAlert = this.transformAlertToDisplay(alert, instance.name, instance.url);
          displayAlert.isSilenced = this.isAlertSilenced(alert, silences);
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

  isAlertSilenced(alert: GrafanaAlert, silences: GrafanaSilence[]): boolean {
    return silences.some(silence => {
      // Check if all matchers match the alert's labels
      return silence.matchers.every(matcher => {
        const labelValue = alert.labels?.[matcher.name];
        if (!labelValue) return false;

        if (matcher.isRegex) {
          try {
            const regex = new RegExp(matcher.value);
            return regex.test(labelValue);
          } catch (e) {
            this.logger.warn(`Invalid regex in silence matcher: ${matcher.value}`);
            return false;
          }
        } else {
          return labelValue === matcher.value;
        }
      });
    });
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
