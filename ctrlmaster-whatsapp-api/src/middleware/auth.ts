import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey || apiKey !== config.apiKey) {
    logger.warn({ ip: req.ip, path: req.path }, 'Intento de acceso no autorizado');
    res.status(401).json({
      success: false,
      error: 'No autorizado. Proporciona una API key válida en el header X-API-Key.',
    });
    return;
  }

  next();
}
