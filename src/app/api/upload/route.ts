/**
 * File upload API route with enhanced security validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { ApiError, ValidationError } from '@/lib/errors';
import { validateApiAuth } from '@/lib/apiAuth';
import { withRateLimit } from '@/lib/rateLimitEnhanced';

export const dynamic = 'force-dynamic';

/**
 * Allowed MIME types for uploads
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/**
 * Maximum file size (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * File magic numbers for validation
 */
const FILE_SIGNATUREATURES = {
  // JPEG: FF D8 FF
  JPEG: [0xFF, 0xD8, 0xFF],
  // PNG: 89 50 4E 47
  PNG: [0x89, 0x50, 0x4E, 0x47],
  // GIF: 47 49 46 38
  GIF: [0x47, 0x49, 0x46, 0x38],
  // WebP: 52 49 46 46 ... 57 45 42 50
  WEBP: [0x52, 0x49, 0x46, 0x46],
  // MP4: 00 00 00 18 66 74 79 70
  MP4: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
  // WebM: 1A 45 DF A3
  WEBM: [0x1A, 0x45, 0xDF, 0xA3],
};

/**
 * Validate file by checking magic numbers
 */
function validateFileSignature(buffer: Buffer): boolean {
  // Check JPEG
  if (FILE_SIGNATUREATURES.JPEG.every((byte, i) => buffer[i] === byte)) {
    return true;
  }
  // Check PNG
  if (FILE_SIGNATUREATURES.PNG.every((byte, i) => buffer[i] === byte)) {
    return true;
  }
  // Check GIF
  if (FILE_SIGNATUREATURES.GIF.every((byte, i) => buffer[i] === byte)) {
    return true;
  }
  // Check WebP
  if (FILE_SIGNATUREATURES.WEBP.every((byte, i) => buffer[i] === byte)) {
    return true;
  }
  // Check MP4
  if (FILE_SIGNATUREATURES.MP4.every((byte, i) => buffer[i] === byte)) {
    return true;
  }
  // Check WebM
  if (FILE_SIGNATUREATURES.WEBM.every((byte, i) => buffer[i] === byte)) {
    return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await withRateLimit('UPLOAD')(req);
    if (rateLimitResult.isRateLimited) {
      return NextResponse.json(
        { error: 'Demasiadas subidas. Espera unos minutos.' },
        { status: 429 }
      );
    }

    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ValidationError('No se recibió ningún archivo');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`El archivo es muy pesado: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ValidationError('Formato de archivo no permitido (solo JPEG, PNG, GIF, WebP, MP4, WebM)');
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file signature (magic numbers)
    if (!validateFileSignature(buffer)) {
      throw new ValidationError('El archivo no parece ser una imagen o video válido');
    }

    // Sanitize filename
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${Date.now()}_${sanitizedFilename}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch { /* exists */ }

    // Write file
    await writeFile(path.join(uploadDir, filename), buffer);

    // Determine type
    const isImage = file.type.startsWith('image/');

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      type: isImage ? 'IMAGE' : 'VIDEO',
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[POST /api/upload] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno al procesar el archivo' }, { status: 500 });
  }
}