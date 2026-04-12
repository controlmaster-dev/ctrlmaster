import type { WhatsAppConfig } from '../types';

export const config: WhatsAppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  apiKey: process.env.WHATSAPP_API_KEY || 'change-me-in-production',
  sessionName: process.env.WHATSAPP_SESSION_NAME || 'ctrlmaster-session',
  reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL || '5000', 10),
  maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '10', 10),
  messageQueueLimit: parseInt(process.env.MESSAGE_QUEUE_LIMIT || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
};
