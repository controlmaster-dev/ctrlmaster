import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user || user.password !== password) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
        }

        // --- Security & Tracking Logic ---
        const forwardedFor = req.headers.get('x-forwarded-for')
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'Unknown'

        // Removed hardcoded '8.8.8.8' fallback for localhost to ensure accuracy.
        // Localhost will now correctly identify as 'Local Loopback' or similar if not public.

        let country = 'Desconocido'
        try {
            // Only query if it looks like a public IP
            if (ip !== 'Unknown' && ip !== '::1' && ip !== '127.0.0.1' && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.16.')) {
                const geoRes = await fetch(`http://ip-api.com/json/${ip}`)
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

        // Update User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                lastLoginIP: ip,
                lastLoginCountry: country
            }
        })

        // Security Alert
        // Trigger if country is known AND foreign (not Costa Rica, not Localhost)
        const isForeign = country !== 'Costa Rica' && country !== 'Localhost' && country !== 'Desconocido'

        if (isForeign) {
            await sendEmail({
                to: 'knunez@enlace.org',
                subject: '🛡️ Seguridad: Inicio de Sesión Inusual Detectado',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #27272a;">
                        <div style="background-color: #f43f5e; padding: 24px; text-align: center;">
                            <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 700;">Alerta de Seguridad</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 16px; margin-bottom: 24px;">Hemos detectado un intento de acceso a tu cuenta administrativa desde una ubicación fuera de lo habitual.</p>
                            
                            <div style="background-color: #18181b; padding: 20px; border-radius: 8px; border: 1px solid #3f3f46; margin-bottom: 24px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #a1a1aa; width: 100px;">Usuario</td>
                                        <td style="padding: 8px 0; color: #fff; font-weight: 600;">${user.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #a1a1aa;">Rol</td>
                                        <td style="padding: 8px 0; color: #fff;">${user.role}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #a1a1aa;">Ubicación</td>
                                        <td style="padding: 8px 0; color: #f43f5e; font-weight: 700;">${country}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #a1a1aa;">IP Address</td>
                                        <td style="padding: 8px 0; code; font-family: monospace; color: #e2e8f0;">${ip}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #a1a1aa;">Fecha</td>
                                        <td style="padding: 8px 0; color: #fff;">${new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 24px;">Si tú realizaste este inicio de sesión (por ejemplo, usando una VPN), puedes ignorar este mensaje.</p>
                            
                            <div style="text-align: center;">
                                <a href="https://enlacesys.com/security" style="display: inline-block; background-color: #f43f5e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Revisar Actividad</a>
                            </div>
                        </div>
                        <div style="background-color: #18181b; padding: 16px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
                            &copy; ${new Date().getFullYear()} Enlace Control Master.
                        </div>
                    </div>
                 `
            })
        }

        // --- End Security Logic ---

        // Return user data (excluding password ideally, but keeping it simple for now as requested)
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image
        })

    } catch (error) {
        console.error("Login Error:", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
    }
}
