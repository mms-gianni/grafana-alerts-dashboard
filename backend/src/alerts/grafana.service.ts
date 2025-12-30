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
  private readonly axiosInstance: AxiosInstance;
  private readonly grafanaUrl: string;

  constructor(private configService: ConfigService) {
    this.grafanaUrl = this.configService.get<string>('GRAFANA_URL');
    const apiKey = this.configService.get<string>('GRAFANA_API_KEY');

    this.axiosInstance = axios.create({
      baseURL: this.grafanaUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private transformAlertToDisplay(alert: GrafanaAlert): DisplayAlert {
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
      url: `${this.grafanaUrl}/alerting/grafana/${alert.uid}/view`,
      ruleGroup: alert.ruleGroup,
      folderUID: alert.folderUID,
      labels: alert.labels || {},
      annotations: alert.annotations || {},
    };
  }

  async getSilences(): Promise<GrafanaSilence[]> {
    const endpoint = '/api/alertmanager/grafana/api/v2/silences';
    const fullUrl = `${this.grafanaUrl}${endpoint}`;
    
    try {
      this.logger.debug(`Fetching silences from: ${fullUrl}`);
      const response = await this.axiosInstance.get(endpoint);
      const silences: GrafanaSilence[] = response.data || [];
      
      // Filter only active silences
      const now = new Date();
      const activeSilences = silences.filter(silence => {
        const startsAt = new Date(silence.startsAt);
        const endsAt = new Date(silence.endsAt);
        return silence.status?.state === 'active' && startsAt <= now && endsAt >= now;
      });
      
      this.logger.log(`Successfully fetched ${activeSilences.length} active silences from Grafana`);
      return activeSilences;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch silences from Grafana (non-critical)\n` +
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
    const endpoint = '/api/v1/provisioning/alert-rules';
    const fullUrl = `${this.grafanaUrl}${endpoint}`;
    
    try {
      this.logger.debug(`Fetching alerts from: ${fullUrl}`);
      const [alertsResponse, silences] = await Promise.all([
        this.axiosInstance.get(endpoint),
        this.getSilences(),
      ]);
      
      const alerts: GrafanaAlert[] = alertsResponse.data || [];
      this.logger.log(`Successfully fetched ${alerts.length} alert rules and ${silences.length} active silences from Grafana`);
      
      // Transform to display format and mark silenced alerts
      const displayAlerts = alerts.map(alert => {
        const displayAlert = this.transformAlertToDisplay(alert);
        displayAlert.isSilenced = this.isAlertSilenced(alert, silences);
        return displayAlert;
      });
      
      return displayAlerts;
    } catch (error) {
      this.logger.error(
        `Failed to fetch alert rules from Grafana\n` +
        `  URL: ${fullUrl}\n` +
        `  Status: ${error.response?.status || 'N/A'}\n` +
        `  Status Text: ${error.response?.statusText || 'N/A'}\n` +
        `  Error Message: ${error.message}\n` +
        `  Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}\n` +
        `  Hint: Make sure you are using the Grafana Alerting Provisioning API`
      );
      throw error;
    }
  }

  async getAlertById(id: number): Promise<GrafanaAlert> {
    const endpoint = `/api/v1/provisioning/alert-rules/${id}`;
    const fullUrl = `${this.grafanaUrl}${endpoint}`;
    
    try {
      this.logger.debug(`Fetching alert ${id} from: ${fullUrl}`);
      const response = await this.axiosInstance.get(endpoint);
      this.logger.log(`Successfully fetched alert ${id} from Grafana`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch alert ${id} from Grafana\n` +
        `  URL: ${fullUrl}\n` +
        `  Status: ${error.response?.status || 'N/A'}\n` +
        `  Status Text: ${error.response?.statusText || 'N/A'}\n` +
        `  Error Message: ${error.message}\n` +
        `  Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}`
      );
      throw error;
    }
  }

  async pauseAlert(uid: string): Promise<void> {
    const endpoint = `/api/v1/provisioning/alert-rules/${uid}`;
    const fullUrl = `${this.grafanaUrl}${endpoint}`;
    
    try {
      this.logger.debug(`Pausing alert ${uid} at: ${fullUrl}`);
      // First get the alert
      const alert = await this.axiosInstance.get(endpoint);
      // Then update it with isPaused: true
      await this.axiosInstance.put(endpoint, {
        ...alert.data,
        isPaused: true,
      });
      this.logger.log(`Alert ${uid} paused successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to pause alert ${uid}\n` +
        `  URL: ${fullUrl}\n` +
        `  Status: ${error.response?.status || 'N/A'}\n` +
        `  Status Text: ${error.response?.statusText || 'N/A'}\n` +
        `  Error Message: ${error.message}\n` +
        `  Response Data: ${JSON.stringify(error.response?.data || {}, null, 2)}`
      );
      throw error;
    }
  }
}
