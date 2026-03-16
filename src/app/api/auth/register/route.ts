import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, confirmPassword, securityCode } = body;

        // Validate all fields
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

        // Validate security code
        const registrationCode = await prisma.registrationCode.findUnique({
            where: { code: securityCode.toUpperCase().trim() },
        });

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

        if (registrationCode.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Este código ha expirado. Solicite uno nuevo al administrador' },
                { status: 401 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase().trim() },
                    { username: email.toLowerCase().trim() },
                ],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con ese correo' },
                { status: 409 }
            );
        }

        // Generate username from email
        const username = email.split('@')[0].toLowerCase();

        // Generate avatar URL
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&size=128`;

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                username,
                password,
                role: 'OPERATOR',
                image: avatarUrl,
            },
        });

        // Mark code as used
        await prisma.registrationCode.update({
            where: { id: registrationCode.id },
            data: {
                usedById: newUser.id,
                usedAt: new Date(),
            },
        });

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
