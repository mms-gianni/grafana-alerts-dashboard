import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DisplayAlert } from './grafana.service';
import { AlertsService } from './alerts.service';
import { getDefaultSettings } from '../config/default-settings';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AlertsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AlertsGateway.name);

  constructor(
    @Inject(forwardRef(() => AlertsService))
    private alertsService: AlertsService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Send default settings to newly connected client
    this.sendDefaultSettings(client);
    // Send current alerts to newly connected client
    this.sendInitialAlerts(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('getAlerts')
  async handleGetAlerts(client: Socket) {
    try {
      const alerts = await this.alertsService.getAlerts();
      client.emit('alerts', alerts);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch alerts' });
    }
  }

  @SubscribeMessage('getSettings')
  handleGetSettings(client: Socket) {
    this.sendDefaultSettings(client);
  }

  broadcastAlerts(alerts: DisplayAlert[]) {
    this.server.emit('alerts', alerts);
  }

  broadcastError(message: string) {
    this.server.emit('error', { message });
  }

  private sendDefaultSettings(client: Socket) {
    const settings = getDefaultSettings();
    client.emit('defaultSettings', settings);
  }

  private async sendInitialAlerts(client: Socket) {
    try {
      const alerts = await this.alertsService.getAlerts();
      client.emit('alerts', alerts);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch initial alerts' });
    }
  }
}
