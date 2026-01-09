import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { GrafanaService } from './grafana.service';

@Controller('api')
export class AlertsController {
  constructor(private readonly grafanaService: GrafanaService) {}

  @Get('annotations')
  async getAnnotations(
    @Query('alertId') alertId: string,
    @Query('instanceName') instanceName: string
  ) {
    if (!alertId) {
      throw new BadRequestException('alertId query parameter is required');
    }
    if (!instanceName) {
      throw new BadRequestException('instanceName query parameter is required');
    }

    const id = parseInt(alertId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('alertId must be a valid number');
    }

    return this.grafanaService.getAnnotations(id, instanceName);
  }
}
