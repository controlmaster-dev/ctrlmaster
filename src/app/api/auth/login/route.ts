import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email/Perfil y contraseña requeridos" }, { status: 400 })
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email }
                ]
            }
        })

        if (!user || user.password !== password) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
        }

        const forwardedFor = req.headers.get('x-forwarded-for')
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'Unknown'

        let country = 'Desconocido'
        try {
            if (ip !== 'Unknown' && ip !== '::1' && ip !== '127.0.0.1' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.16.')) {
                const geoRes = await fetch("http://ip-api.com/json/" + ip)
                const geoData = await geoRes.json()
                if (geoData.status === 'success') {
                    country = geoData.country
                }
            } else if (ip === '::1' || ip === '127.0.0.1') {
                country = 'Localhost'
            }
        } catch (e) {
            console.error("GeoIP Error:", e)
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                lastLoginIP: ip,
                lastLoginCountry: country
            }
        })

        const isForeign = country !== 'Costa Rica' && country !== 'Localhost' && country !== 'Desconocido'

        if (isForeign) {
            await sendEmail({
                to: 'knunez@enlace.org',
                subject: ' Seguridad: Inicio de Sesión Inusual Detectado',
                html: 'Inusual login'
            })
        }

        console.log("Login Success for ID/Email:", email)
        console.log("Returned User Data:", {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.image
        })

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            username: (user as any).username,
            role: user.role,
            avatar: user.image
        })

    } catch (error) {
        console.error("Login Error:", error)
        return NextResponse.json({
            error: "Error en el servidor",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
