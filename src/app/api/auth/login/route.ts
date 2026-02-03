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
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta name="color-scheme" content="dark only">
                        <meta name="supported-color-schemes" content="dark only">
                        <style>
                            :root { color-scheme: dark only; supported-color-schemes: dark only; }
                            body { margin: 0; padding: 0; background-color: #09090b !important; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased; }
                            .main-table { background-color: #09090b !important; }
                            .container { max-width: 600px; margin: 0 auto; background-color: #09090b !important; border-radius: 16px; overflow: hidden; border: 1px solid #27272a; }
                            .accent-bar { height: 4px; background-color: #ef4444; }
                            .header { padding: 32px 40px; border-bottom: 1px solid #27272a; text-align: left; }
                            .brand { color: #ef4444; font-weight: 800; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px; }
                            .title { margin: 0; color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
                            .content { padding: 40px; }
                            .message { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; text-align: left; }
                            .data-box { background-color: #18181b; padding: 24px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 32px; }
                            .data-table { width: 100%; border-collapse: collapse; }
                            .data-label { padding: 10px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 110px; text-align: left; }
                            .data-value { padding: 10px 0; color: #f8fafc; font-weight: 600; font-size: 14px; text-align: left; }
                            .footer { background-color: #121214; padding: 24px; text-align: center; border-top: 1px solid #27272a; }
                            .footer-text { font-size: 11px; color: #71717a; margin: 0; }
                            
                            @media only screen and (max-width: 600px) {
                                .container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border: none !important; }
                                .content, .header, .footer { padding: 24px !important; }
                            }
                        </style>
                    </head>
                    <body bgcolor="#09090b">
                        <table class="main-table" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#09090b" style="table-layout: fixed;">
                            <tr>
                                <td align="center" style="padding: 40px 0;">
                                    <div class="container" bgcolor="#09090b">
                                        <div class="accent-bar"></div>
                                        <div class="header">
                                            <span class="brand">SEGURIDAD</span>
                                            <h1 class="title">Inicio de Sesión Inusual</h1>
                                        </div>

                                        <div class="content">
                                            <p class="message">Hemos detectado un acceso a tu cuenta administrativa desde una ubicación fuera de lo habitual.</p>
                                            
                                            <div class="data-box" bgcolor="#18181b">
                                                <table class="data-table" width="100%">
                                                    <tr>
                                                        <td class="data-label">Usuario</td>
                                                        <td class="data-value">${user.name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td class="data-label">Ubicación</td>
                                                        <td class="data-value" style="color: #ef4444;">${country}</td>
                                                    </tr>
                                                    <tr>
                                                        <td class="data-label">Dirección IP</td>
                                                        <td class="data-value" style="font-family: monospace;">${ip}</td>
                                                    </tr>
                                                    <tr>
                                                        <td class="data-label">Fecha</td>
                                                        <td class="data-value">${new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}</td>
                                                    </tr>
                                                </table>
                                            </div>

                                            <p style="font-size: 13px; color: #71717a; margin-bottom: 32px; font-style: italic; text-align: left;">Si no fuiste tú, por favor contacta al equipo de ingeniería de inmediato.</p>
                                            
                                            <div style="text-align: center;">
                                                <a href="https://enlacecr.dev/security" style="display: inline-block; background-color: #ef4444; color: #ffffff !important; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">Revisar Actividad</a>
                                            </div>
                                        </div>

                                        <div class="footer" bgcolor="#121214">
                                            <p class="footer-text">© ${new Date().getFullYear()} Enlace - Control Master</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
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
