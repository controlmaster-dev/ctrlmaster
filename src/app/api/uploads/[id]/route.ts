import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';
import { decryptBuffer } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

type UploadedFileRow = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  ciphertext: Buffer | Uint8Array;
  iv: string;
  authTag: string;
};

function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `inline; filename="${fallback}"`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  try {
    const [file] = await sql<UploadedFileRow[]>`
      SELECT "id", "filename", "contentType", "size", "ciphertext", "iv", "authTag"
      FROM "UploadedFile"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    if (!file) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    const plaintext = decryptBuffer({
      ciphertext: file.ciphertext,
      iv: file.iv,
      authTag: file.authTag,
    });

    return new NextResponse(new Uint8Array(plaintext), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Length': String(file.size),
        'Content-Disposition': contentDisposition(file.filename),
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[GET /api/uploads/:id] error:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el archivo' },
      { status: 500 }
    );
  }
}
