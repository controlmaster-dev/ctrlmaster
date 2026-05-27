import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const credentials = await sql`
      SELECT * FROM "Credential" ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(credentials);
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

    const roleCheck = requireRole(user, ['ENGINEER', 'ADMIN', 'BOSS']);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await req.json();
    const { service, category, username, password, notes } = body;

    if (!service || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newCredential] = await sql`
      INSERT INTO "Credential" ("service", "category", "username", "password", "notes")
      VALUES (${service}, ${category || 'General'}, ${username}, ${password}, ${notes || null})
      RETURNING *
    `;
    return NextResponse.json(newCredential);
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

    const roleCheck = requireRole(user, ['ENGINEER', 'ADMIN', 'BOSS']);
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

    const roleCheck = requireRole(user, ['ENGINEER', 'ADMIN', 'BOSS']);
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    const { service, category, username, password, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE "Credential"
      SET
        "service" = COALESCE(${service || null}, "service"),
        "category" = COALESCE(${category || 'General'}, "category"),
        "username" = COALESCE(${username || null}, "username"),
        "password" = COALESCE(${password || null}, "password"),
        "notes" = COALESCE(${notes ?? null}, "notes")
      WHERE "id" = ${id}
      RETURNING *
    `;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json({ error: 'Error updating credential' }, { status: 500 });
  }
}
