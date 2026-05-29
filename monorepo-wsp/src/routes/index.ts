import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { whatsappService } from '../services/whatsapp.js';
import { messageQueue } from '../lib/messageQueue.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

const router = express.Router();

// ─── Health (no auth required) ──────────────────────────────────────────────

router.get('/health', (req, res) => {
  const health = whatsappService.getHealth();
  const statusCode = health.status === 'connected' ? 200 : 503;

  res.status(statusCode).json({
    success: health.status === 'connected',
    data: health,
  });
});

// ─── Send Message ────────────────────────────────────────────────────────────

router.post('/send-message', authMiddleware, async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    res.status(400).json({
      success: false,
      error: 'Faltan parámetros: phone y message son requeridos.',
    });
    return;
  }

  if (typeof phone !== 'string' || typeof message !== 'string') {
    res.status(400).json({
      success: false,
      error: 'phone y message deben ser strings.',
    });
    return;
  }

  try {
    await whatsappService.sendMessage(phone, message);

    res.json({
      success: true,
      data: { phone, sentAt: new Date().toISOString() },
    });
  } catch (error: any) {
    logger.error({ phone, error: error.message }, 'Error enviando mensaje');
    res.status(500).json({
      success: false,
      error: error.message || 'Error enviando mensaje',
    });
  }
});

// ─── Send Bulk Messages ──────────────────────────────────────────────────────

router.post('/send-bulk', authMiddleware, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({
      success: false,
      error: 'messages debe ser un array de { phone, message }.',
    });
    return;
  }

  if (messages.length === 0) {
    res.status(400).json({
      success: false,
      error: 'messages no puede estar vacío.',
    });
    return;
  }

  try {
    const queueIds = await whatsappService.sendBulkMessage(messages);

    res.json({
      success: true,
      data: {
        queued: messages.length,
        queueIds,
        queuedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error enviando mensajes masivos');
    res.status(500).json({
      success: false,
      error: error.message || 'Error enviando mensajes masivos',
    });
  }
});

// ─── Queue Status ────────────────────────────────────────────────────────────

router.get('/queue', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      size: messageQueue.size,
      processing: messageQueue.size > 0,
    },
  });
});

// ─── Clear Queue ─────────────────────────────────────────────────────────────

router.post('/queue/clear', authMiddleware, (req, res) => {
  messageQueue.clear();

  res.json({
    success: true,
    data: { message: 'Cola limpiada' },
  });
});

// ─── Export router ───────────────────────────────────────────────────────────

export default router;
