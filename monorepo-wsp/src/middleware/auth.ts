import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Read directly from env to avoid import-order issues with dotenv
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.WHATSAPP_API_KEY || 'change-me-in-production';

  if (!apiKey || apiKey !== expectedKey) {
    logger.warn({ ip: req.ip, path: req.path, provided: !!apiKey }, 'Intento de acceso no autorizado a WhatsApp API');
    res.status(401).json({
      success: false,
      error: 'No autorizado. Proporciona una API key válida en el header X-API-Key.',
    });
    return;
  }

  next();
}
