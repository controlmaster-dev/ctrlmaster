import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { whatsappService } from './services/whatsapp.js';
import { messageQueue, MessageQueue } from './lib/messageQueue.js';
import { logger } from './lib/logger.js';
import { config } from './config/index.js';

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api', routes);

// Favicon route - just return 204
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
  });
});

// ─── Initialize WhatsApp ─────────────────────────────────────────────────────

// Set the send handler for the message queue
MessageQueue.sendHandler = (phone, message) => whatsappService.sendMessage(phone, message);

// Start WhatsApp
whatsappService.initialize();

// ─── Start Server ────────────────────────────────────────────────────────────

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, `Señal recibida, cerrando...`);
  await whatsappService.shutdown();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

app.listen(config.port, () => {
  logger.info(`🚀 CtrlMaster WhatsApp API corriendo en puerto ${config.port}`);
  logger.info(`📋 Documentación: http://localhost:${config.port}/api/health`);
  logger.info(`🔑 API Key configurada: ${config.apiKey !== 'change-me-in-production' ? '✅ Sí' : '❌ No (usa el default)'}`);
});
