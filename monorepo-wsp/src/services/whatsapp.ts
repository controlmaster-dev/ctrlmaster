import makeWASocket, {
  AuthenticationState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
  WAMessageContent,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import type { HealthStatus } from '../types/index.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { messageQueue } from '../lib/messageQueue.js';
import fs from 'fs';
import path from 'path';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
type SaveCreds = () => Promise<void>;

interface BaileysError extends Error {
  output?: {
    statusCode?: number;
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export class WhatsAppService {
  private socket: WASocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private startTime = Date.now();
  private messagesSent = 0;
  private messagesFailed = 0;
  private isShuttingDown = false;
  private messageStore = new Map<string, WAMessageContent>();
  private messageStorePath = `./sessions/${config.sessionName}/sent_messages.json`;

  private loadMessageStore() {
    try {
      if (fs.existsSync(this.messageStorePath)) {
        const data = fs.readFileSync(this.messageStorePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.messageStore = new Map(Object.entries(parsed));
        logger.info({ size: this.messageStore.size }, '💾 Almacén de mensajes cargado desde disco');
      }
    } catch (error) {
      logger.error({ error }, '❌ Error al cargar messageStore desde disco');
    }
  }

  private saveMessageStore() {
    try {
      const dir = path.dirname(this.messageStorePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const obj = Object.fromEntries(this.messageStore.entries());
      fs.writeFileSync(this.messageStorePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (error) {
      logger.error({ error }, '❌ Error al guardar messageStore en disco');
    }
  }

  async initialize(): Promise<void> {
    logger.info('Inicializando WhatsApp connection...');

    this.loadMessageStore();

    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${config.sessionName}`);
    const { version } = await fetchLatestBaileysVersion();

    logger.info({ version }, 'Usando Baileys version');

    this.connect(state, saveCreds, version);
  }

  private async connect(state: AuthenticationState, saveCreds: SaveCreds, version: [number, number, number]): Promise<void> {
    if (this.isShuttingDown) return;

    if (this.socket) {
      try { (this.socket.ev as any).removeAllListeners(); } catch {}
      try { this.socket.end(new Error('Reconnecting')); } catch {}
      this.socket = null;
    }

    this.connectionState = 'connecting';
    this.socket = makeWASocket({
      version,
      auth: state,
      browser: ['CtrlMaster', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async (key) => {
        const storeKey = `${key.remoteJid}_${key.id}`;
        return this.messageStore.get(storeKey) || undefined;
      },
    });

    this.socket.ev.on('creds.update', saveCreds);

    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.warn('📱 Escanea este QR con WhatsApp > Dispositivos vinculados');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        logger.info('✅ WhatsApp conectado exitosamente');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.startTime = Date.now();

        logger.info({ queueSize: messageQueue.size }, 'Procesando mensajes en cola...');
      }

      if (connection === 'close') {
        this.connectionState = 'disconnected';
        const reason = (lastDisconnect?.error as BaileysError | undefined)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        logger.warn({ reason, shouldReconnect }, '⚠️ WhatsApp desconectado');

        if (shouldReconnect) {
          this.handleReconnect(state, saveCreds, version);
        } else {
          logger.error('❌ Sesión cerrada. Elimina la carpeta de sesiones y reinicia.');
        }
      }
    });

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

  private async handleReconnect(state: AuthenticationState, saveCreds: SaveCreds, version: [number, number, number]): Promise<void> {
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
      const sentMsg = await this.socket.sendMessage(number, { text: message });
      
      if (sentMsg && sentMsg.message) {
        const storeKey = `${sentMsg.key.remoteJid}_${sentMsg.key.id}`;
        this.messageStore.set(storeKey, sentMsg.message);
        
        if (this.messageStore.size > 1000) {
          const firstKey = this.messageStore.keys().next().value;
          if (firstKey) this.messageStore.delete(firstKey);
        }

        this.saveMessageStore();
      }

      this.messagesSent++;
      logger.info({ phone: number }, '📤 Mensaje enviado');
    } catch (error: unknown) {
      this.messagesFailed++;
      logger.error({ phone: number, error: getErrorMessage(error, 'Error enviando mensaje') }, '❌ Error enviando mensaje');
      throw error;
    }
  }

  async sendBulkMessage(messages: { phone: string; message: string }[]): Promise<string[]> {
    const ids: string[] = [];

    for (const msg of messages) {
      const queueId = await messageQueue.enqueue(msg.phone, msg.message);
      ids.push(queueId);

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
    let number = phone.replace(/\D/g, '');

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
