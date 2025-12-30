import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GrafanaService, DisplayAlert } from './grafana.service';
import { AlertsGateway } from './alerts.gateway';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private previousAlerts: DisplayAlert[] = [];

  constructor(
    private grafanaService: GrafanaService,
    @Inject(forwardRef(() => AlertsGateway))
    private alertsGateway: AlertsGateway,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollAlerts() {
    try {
      const alerts = await this.grafanaService.getAlerts();
      
      // Check for changes
      const hasChanges = this.detectChanges(alerts);
      
      if (hasChanges) {
        this.logger.log(`Detected ${alerts.length} alerts, broadcasting to clients`);
        this.alertsGateway.broadcastAlerts(alerts);
        this.previousAlerts = alerts;
      }
    } catch (error) {
      this.logger.error('Failed to poll alerts', error.message);
      this.alertsGateway.broadcastError('Failed to fetch alerts from Grafana');
    }
  }

  private detectChanges(newAlerts: DisplayAlert[]): boolean {
    if (newAlerts.length !== this.previousAlerts.length) {
      return true;
    }

    // Check if any alert data has changed
    for (let i = 0; i < newAlerts.length; i++) {
      const newAlert = newAlerts[i];
      const oldAlert = this.previousAlerts.find(a => a.uid === newAlert.uid);
      
      if (!oldAlert || 
          oldAlert.state !== newAlert.state || 
          oldAlert.newStateDate !== newAlert.newStateDate) {
        return true;
      }
    }

    return false;
  }

  async getAlerts(): Promise<DisplayAlert[]> {
    return this.grafanaService.getAlerts();
  }
}
