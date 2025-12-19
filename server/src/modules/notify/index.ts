import { logger } from '../common/logger.js';
import type { WebhookPayload } from '../../types/index.js';

export interface NotificationProvider {
  handleWebhook(payload: unknown): Promise<void>;
  subscribeAddress(address: string, chain: string): Promise<string>;
  unsubscribeAddress(subscriptionId: string): Promise<void>;
}

export class HeliusWebhookProvider implements NotificationProvider {
  async handleWebhook(payload: unknown): Promise<void> {
    logger.info('Helius webhook received', { payload });
    // Process webhook payload
    // In production, this would emit events, update database, etc.
  }

  async subscribeAddress(address: string, chain: string): Promise<string> {
    logger.info('Subscribing to address', { address, chain });
    // In production, this would call Helius webhook API
    return `sub_${Date.now()}`;
  }

  async unsubscribeAddress(subscriptionId: string): Promise<void> {
    logger.info('Unsubscribing', { subscriptionId });
    // In production, this would call Helius webhook API
  }
}

export function getNotificationProvider(): NotificationProvider {
  return new HeliusWebhookProvider();
}

