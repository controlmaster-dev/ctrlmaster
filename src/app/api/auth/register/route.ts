import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withRateLimit } from '@/lib/rateLimitEnhanced';

export async function POST(req: NextRequest) {
    try {
        const rateLimitResult = await withRateLimit('AUTH')(req);
        if (rateLimitResult.isRateLimited) {
            return NextResponse.json(
                { error: 'Demasiados intentos de registro. Espera unos minutos.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { name, email, password, confirmPassword, securityCode } = body;

        if (!name || !email || !password || !securityCode) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'Las contraseñas no coinciden' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }

        const [registrationCode] = await sql`
            SELECT * FROM "RegistrationCode"
            WHERE "code" = ${securityCode.toUpperCase().trim()}
            LIMIT 1
        `;

        if (!registrationCode) {
            return NextResponse.json(
                { error: 'Código de seguridad inválido' },
                { status: 401 }
            );
        }

        if (registrationCode.usedById) {
            return NextResponse.json(
                { error: 'Este código ya fue utilizado' },
                { status: 401 }
            );
        }

        if (new Date(registrationCode.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: 'Este código ha expirado. Solicite uno nuevo al administrador' },
                { status: 401 }
            );
        }

        const [existingUser] = await sql`
            SELECT * FROM "User"
            WHERE "email" = ${email.toLowerCase().trim()}
               OR "username" = ${email.toLowerCase().trim()}
            LIMIT 1
        `;

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con ese correo' },
                { status: 409 }
            );
        }

        const username = email.split('@')[0].toLowerCase();
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=128`;

        const [newUser] = await sql`
            INSERT INTO "User" ("name", "email", "username", "password", "role", "image")
            VALUES (${name.trim()}, ${email.toLowerCase().trim()}, ${username}, ${password}, 'OPERATOR', ${avatarUrl})
            RETURNING *
        `;

        await sql`
            UPDATE "RegistrationCode"
            SET "usedById" = ${newUser.id}, "usedAt" = NOW()
            WHERE "id" = ${registrationCode.id}
        `;

        console.log('New user registered:', newUser.name, newUser.email);

        return NextResponse.json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
            avatar: newUser.image,
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            {
                error: 'Error en el servidor',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
