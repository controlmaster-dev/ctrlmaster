import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import type { HealthStatus } from '../types/index.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { messageQueue } from '../lib/messageQueue.js';

export class WhatsAppService {
  private socket: WASocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private startTime = Date.now();
  private messagesSent = 0;
  private messagesFailed = 0;
  private isShuttingDown = false;

  async initialize(): Promise<void> {
    logger.info('Inicializando WhatsApp connection...');

    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${config.sessionName}`);
    const { version } = await fetchLatestBaileysVersion();

    logger.info({ version }, 'Usando Baileys version');

    this.connect(state, saveCreds, version);
  }

  private async connect(state: any, saveCreds: any, version: [number, number, number]): Promise<void> {
    if (this.isShuttingDown) return;

    this.socket = makeWASocket({
      version,
      auth: state,
      browser: ['CtrlMaster', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    // Save credentials on auth update
    this.socket.ev.on('creds.update', saveCreds);

    // Connection update
    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.warn('📱 Escanea este QR con WhatsApp > Dispositivos vinculados');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        logger.info('✅ WhatsApp conectado exitosamente');
        this.reconnectAttempts = 0;
        this.startTime = Date.now();

        // Start processing queued messages
        logger.info({ queueSize: messageQueue.size }, 'Procesando mensajes en cola...');
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        logger.warn({ reason, shouldReconnect }, '⚠️ WhatsApp desconectado');

        if (shouldReconnect) {
          this.handleReconnect(state, saveCreds, version);
        } else {
          logger.error('❌ Sesión cerrada. Elimina la carpeta de sesiones y reinicia.');
        }
      }
    });

    // Handle incoming messages
    this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      const msg = messages[0];
      if (!msg.message) return;

      const from = msg.key.remoteJid;
      const sender = msg.pushName || 'Desconocido';
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

      if (text) {
        logger.info({ from, sender, text: text.substring(0, 100) }, '📩 Mensaje recibido');
      }
    });
  }

  private async handleReconnect(state: any, saveCreds: any, version: [number, number, number]): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= config.maxReconnectAttempts) {
      logger.error({ attempts: this.reconnectAttempts }, '❌ Máximos reintentos alcanzados');
      return;
    }

    this.reconnectAttempts++;
    const delay = config.reconnectInterval * this.reconnectAttempts;

    logger.info(
      { attempt: this.reconnectAttempts, delay },
      '🔄 Reintentando conexión...'
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect(state, saveCreds, version);
    }, delay);
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    if (!this.socket) {
      throw new Error('WhatsApp no está conectado');
    }

    const number = this.formatNumber(phone);

    try {
      await this.socket.sendMessage(number, { text: message });
      this.messagesSent++;
      logger.info({ phone: number }, '📤 Mensaje enviado');
    } catch (error: any) {
      this.messagesFailed++;
      logger.error({ phone: number, error: error.message }, '❌ Error enviando mensaje');
      throw error;
    }
  }

  async sendBulkMessage(messages: { phone: string; message: string }[]): Promise<string[]> {
    const ids: string[] = [];

    for (const msg of messages) {
      const queueId = await messageQueue.enqueue(msg.phone, msg.message);
      ids.push(queueId);

      // Small delay between bulk sends
      await this.sleep(1000);
    }

    return ids;
  }

  getHealth(): HealthStatus {
    return {
      status: this.socket ? 'connected' : 'disconnected',
      uptime: Date.now() - this.startTime,
      messagesSent: this.messagesSent,
      messagesFailed: this.messagesFailed,
      queueSize: messageQueue.size,
      lastReconnect:
        this.reconnectAttempts > 0 ? new Date(Date.now() - config.reconnectInterval * this.reconnectAttempts) : null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Cerrando WhatsApp connection...');
    this.isShuttingDown = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.socket) {
      this.socket.end(new Error('Shutdown requested'));
      this.socket = null;
    }
  }

  private formatNumber(phone: string): string {
    // Remove all non-numeric characters
    let number = phone.replace(/\D/g, '');

    // Add country code if not present (default: Costa Rica +506)
    if (!number.startsWith('506') && number.length === 8) {
      number = '506' + number;
    }

    return number + '@s.whatsapp.net';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const whatsappService = new WhatsAppService();
