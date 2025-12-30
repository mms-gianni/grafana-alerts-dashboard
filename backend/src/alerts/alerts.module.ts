import { Module } from '@nestjs/common';
import { AlertsGateway } from './alerts.gateway';
import { GrafanaService } from './grafana.service';
import { AlertsService } from './alerts.service';

@Module({
  providers: [AlertsGateway, GrafanaService, AlertsService],
})
export class AlertsModule {}
