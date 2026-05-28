import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['ADMIN', 'BOSS', 'ENGINEER'];

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(bytes[i] % chars.length);
    }
    return code;
}

// GET - List all registration codes (admin only)
export async function GET(req: NextRequest) {
    try {
        const authResult = await validateApiAuth(req);
        if (authResult instanceof NextResponse) return authResult;
        const roleResult = requireRole(authResult.user, ADMIN_ROLES);
        if (roleResult instanceof NextResponse) return roleResult;

        const codes = await sql`
            SELECT * FROM "RegistrationCode" ORDER BY "createdAt" DESC
        `;

        const mapped = codes.map((c: any) => {
            const now = new Date();
            let status: string = 'available';
            if (c.usedById) status = 'used';
            else if (new Date(c.expiresAt) < now) status = 'expired';

            return { ...c, status };
        });

        return NextResponse.json(mapped);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error fetching codes' },
            { status: 500 }
        );
    }
}

// POST - Generate a new registration code
export async function POST(req: NextRequest) {
    try {
        const authResult = await validateApiAuth(req);
        if (authResult instanceof NextResponse) return authResult;
        const roleResult = requireRole(authResult.user, ADMIN_ROLES);
        if (roleResult instanceof NextResponse) return roleResult;

        const createdById = authResult.user.id;

        let code = generateCode();
        let attempts = 0;
        while (attempts < 10) {
            const [existing] = await sql`
                SELECT "id" FROM "RegistrationCode" WHERE "code" = ${code} LIMIT 1
            `;
            if (!existing) break;
            code = generateCode();
            attempts++;
        }

        const [registrationCode] = await sql`
            INSERT INTO "RegistrationCode" ("code", "createdById", "expiresAt")
            VALUES (${code}, ${createdById}, ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()})
            RETURNING *
        `;

        return NextResponse.json(registrationCode);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error creating code' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a registration code
export async function DELETE(req: NextRequest) {
    try {
        const authResult = await validateApiAuth(req);
        if (authResult instanceof NextResponse) return authResult;
        const roleResult = requireRole(authResult.user, ADMIN_ROLES);
        if (roleResult instanceof NextResponse) return roleResult;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
        }

        await sql`DELETE FROM "RegistrationCode" WHERE "id" = ${id}`;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error deleting code' },
            { status: 500 }
        );
    }
}
