import type { MessageQueueItem } from '../types/index.js';
import { logger } from './logger.js';
import { config } from '../config/index.js';

export class MessageQueue {
  private queue: MessageQueueItem[] = [];
  private processing = false;

  get size(): number {
    return this.queue.length;
  }

  async enqueue(phone: string, message: string, maxRetries = 3): Promise<string> {
    if (this.queue.length >= config.messageQueueLimit) {
      throw new Error(`Cola llena (${config.messageQueueLimit} mensajes). Intenta más tarde.`);
    }

    const item: MessageQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      phone,
      message,
      retries: 0,
      maxRetries,
      createdAt: new Date(),
    };

    this.queue.push(item);
    logger.info({ queueId: item.id, phone }, 'Mensaje agregado a la cola');

    // Start processing if not already running
    if (!this.processing) {
      this.process();
    }

    return item.id;
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await this.sendMessage(item);
        this.queue.shift();
        logger.info({ queueId: item.id, phone: item.phone }, 'Mensaje enviado exitosamente');
      } catch (error) {
        item.retries++;

        if (item.retries >= item.maxRetries) {
          this.queue.shift();
          logger.error(
            { queueId: item.id, phone: item.phone, error },
            'Mensaje falló después de todos los reintentos'
          );
        } else {
          const delay = Math.min(1000 * Math.pow(2, item.retries), 30000);
          logger.warn(
            { queueId: item.id, phone: item.phone, retry: item.retries, delay },
            'Mensaje falló, reintentando...'
          );
          await this.sleep(delay);
        }
      }

      // Small delay between messages to avoid rate limiting
      await this.sleep(500);
    }

    this.processing = false;
  }

  private async sendMessage(item: MessageQueueItem): Promise<void> {
    // This will be called by WhatsAppService with the actual send logic
    // We'll set this handler during initialization
    if (!MessageQueue.sendHandler) {
      throw new Error('WhatsApp no está conectado');
    }
    await MessageQueue.sendHandler(item.phone, item.message);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  clear(): void {
    const count = this.queue.length;
    this.queue = [];
    logger.info({ count }, 'Cola de mensajes limpiada');
  }

  static sendHandler: ((phone: string, message: string) => Promise<void>) | null = null;
}

export const messageQueue = new MessageQueue();
