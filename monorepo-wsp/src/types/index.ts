export interface WhatsAppConfig {
  port: number;
  apiKey: string;
  sessionName: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  messageQueueLimit: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export interface SendMessageRequest {
  phone: string;
  message: string;
  isGroup?: boolean;
}

export interface MessageQueueItem {
  id: string;
  phone: string;
  message: string;
  retries: number;
  maxRetries: number;
  createdAt: Date;
}

export interface HealthStatus {
  status: 'connected' | 'connecting' | 'disconnected';
  uptime: number;
  messagesSent: number;
  messagesFailed: number;
  queueSize: number;
  lastReconnect: Date | null;
  reconnectAttempts: number;
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}
