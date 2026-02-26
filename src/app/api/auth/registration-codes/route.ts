import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET - List all registration codes (admin only)
export async function GET() {
    try {
        const codes = await prisma.registrationCode.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const mapped = codes.map((c) => {
            const now = new Date();
            let status: string = 'available';
            if (c.usedById) status = 'used';
            else if (c.expiresAt < now) status = 'expired';

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
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { createdById } = body;

        if (!createdById) {
            return NextResponse.json({ error: 'createdById is required' }, { status: 400 });
        }

        // Generate unique code
        let code = generateCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.registrationCode.findUnique({ where: { code } });
            if (!existing) break;
            code = generateCode();
            attempts++;
        }

        const registrationCode = await prisma.registrationCode.create({
            data: {
                code,
                createdById,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        return NextResponse.json(registrationCode);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error creating code' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a registration code
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
        }

        await prisma.registrationCode.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error deleting code' },
            { status: 500 }
        );
    }
}
