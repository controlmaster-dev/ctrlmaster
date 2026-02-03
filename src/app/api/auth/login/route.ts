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
                    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; background-color: #09090b; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
                        <!-- Accent Bar (Red for Security) -->
                        <div style="height: 4px; background-color: #ef4444;"></div>

                        <div style="padding: 32px 40px; border-bottom: 1px solid #27272a;">
                            <span style="color: #ef4444; font-weight: 800; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px;">SEGURIDAD</span>
                            <h1 style="margin: 0; color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Inicio de Sesión Inusual</h1>
                        </div>

                        <div style="padding: 40px;">
                            <p style="font-size: 15px; margin: 0 0 24px 0; color: #94a3b8; line-height: 1.6;">Hemos detectado un acceso a tu cuenta administrativa desde una ubicación fuera de lo habitual.</p>
                            
                            <div style="background-color: #18181b; padding: 24px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 32px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; width: 110px;">Usuario</td>
                                        <td style="padding: 10px 0; color: #f8fafc; font-weight: 600; font-size: 14px;">${user.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; text-transform: uppercase;">Ubicación</td>
                                        <td style="padding: 10px 0; color: #ef4444; font-weight: 700; font-size: 14px;">${country}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; text-transform: uppercase;">Dirección IP</td>
                                        <td style="padding: 10px 0; font-family: monospace; color: #f8fafc; font-size: 13px;">${ip}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; text-transform: uppercase;">Fecha</td>
                                        <td style="padding: 10px 0; color: #f8fafc; font-size: 14px;">${new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="font-size: 14px; color: #71717a; margin-bottom: 32px; font-style: italic;">Si no fuiste tú, por favor contacta al equipo de ingeniería de inmediato.</p>
                            
                            <div style="text-align: center;">
                                <a href="https://enlacecr.dev/security" style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">Revisar Actividad</a>
                            </div>
                        </div>

                        <div style="background-color: #121214; padding: 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #27272a;">
                            &copy; ${new Date().getFullYear()} Enlace - Control Master
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
        return NextResponse.json({
            error: "Error en el servidor",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
