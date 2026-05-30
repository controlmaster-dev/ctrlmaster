import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';
import { encryptSecret, decryptSecret } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

const CREDENTIAL_ROLES = ['ENGINEER', 'ADMIN', 'BOSS'];

interface CredentialRow {
  password: string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(authResult.user, CREDENTIAL_ROLES);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const credentials = await sql`
      SELECT "id", "service", "category", "username", "password", "notes", "createdAt", "updatedAt"
      FROM "Credential" ORDER BY "createdAt" DESC
    `;

    const decrypted = (credentials as unknown as CredentialRow[]).map((c) => ({
      ...c,
      password: decryptSecret(c.password),
    }));

    return NextResponse.json(decrypted);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Error fetching credentials' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const roleCheck = requireRole(user, CREDENTIAL_ROLES);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await req.json();
    const { service, category, username, password, notes } = body;

    if (!service || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newCredential] = await sql`
      INSERT INTO "Credential" ("service", "category", "username", "password", "notes")
      VALUES (${service}, ${category || 'General'}, ${username}, ${encryptSecret(password)}, ${notes || null})
      RETURNING *
    `;
    return NextResponse.json({ ...newCredential, password: decryptSecret(newCredential.password) });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json({ error: 'Error creating credential' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const roleCheck = requireRole(user, CREDENTIAL_ROLES);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await sql`DELETE FROM "Credential" WHERE "id" = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Error deleting credential' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const roleCheck = requireRole(user, CREDENTIAL_ROLES);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    const { service, category, username, password, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const encryptedPassword = password ? encryptSecret(password) : null;

    const [updated] = await sql`
      UPDATE "Credential"
      SET
        "service" = COALESCE(${service || null}, "service"),
        "category" = COALESCE(${category || 'General'}, "category"),
        "username" = COALESCE(${username || null}, "username"),
        "password" = COALESCE(${encryptedPassword}, "password"),
        "notes" = COALESCE(${notes ?? null}, "notes")
      WHERE "id" = ${id}
      RETURNING *
    `;

    return NextResponse.json({ ...updated, password: decryptSecret(updated.password) });
  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json({ error: 'Error updating credential' }, { status: 500 });
  }
}
