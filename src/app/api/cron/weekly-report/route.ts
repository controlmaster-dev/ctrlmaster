
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'



export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { emails } = body
        if (!emails || !Array.isArray(emails)) {
            return NextResponse.json({ error: 'Invalid emails array' }, { status: 400 })
        }
        // Manual Trigger: Report on CURRENT week to see latest status
        return await generateAndSendReport(emails, 'CURRENT')
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export async function GET() {
    // Cron Job: Report on LAST week (Standard)
    return await generateAndSendReport(['knunez@enlace.org'], 'LAST')
}

async function generateAndSendReport(recipients: string[], mode: 'CURRENT' | 'LAST' = 'LAST') {
    try {
        console.log(`[Weekly Report] Starting... Mode: ${mode}`)

        const timeZone = 'America/Costa_Rica'
        const now = toZonedTime(new Date(), timeZone)

        let start, end

        if (mode === 'LAST') {
            // Last Complete Week (Mon-Sun)
            start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
            end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        } else {
            // Current Week (Mon-Sun)
            start = startOfWeek(now, { weekStartsOn: 1 })
            end = endOfWeek(now, { weekStartsOn: 1 })
        }

        const dateStartStr = format(start, 'yyyy-MM-dd')
        const dateEndStr = format(end, 'yyyy-MM-dd')

        console.log(`[Weekly Report] Range: ${dateStartStr} to ${dateEndStr}`)

        // 1. Fetch ALL Operators
        const operators = await prisma.user.findMany({
            where: { role: 'OPERATOR' },
            select: { id: true, name: true, email: true }
        })

        // 2. Fetch Tasks for that range
        const tasks = await prisma.task.findMany({
            where: {
                scheduledDate: {
                    gte: dateStartStr,
                    lte: dateEndStr
                }
            }
        })

        // 3. Map Stats
        const stats = operators.map(op => {
            const userTasks = tasks.filter(t => t.userId === op.id)
            const total = userTasks.length
            const completed = userTasks.filter(t => t.status === 'COMPLETED').length
            const incomplete = userTasks.filter(t => t.status === 'INCOMPLETE').length
            const pending = userTasks.filter(t => t.status === 'PENDING').length
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0 // 0% if 0 tasks

            return {
                name: op.name,
                total,
                completed,
                incomplete,
                pending,
                percentage
            }
        })

        // Sort by Percentage DESC
        stats.sort((a, b) => b.percentage - a.percentage)

        // 4. Generate PDF (Premium Design V3 - Reference Match)
        const doc = new jsPDF()

        // ---------------- HEADER ----------------
        // Logo would go here (15, 15)

        doc.setFontSize(24)
        doc.setTextColor(50, 50, 50)
        doc.setFont("helvetica", "bold")
        doc.text("REPORTE DE RENDIMIENTO", 20, 30) // Left aligned title like reference

        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.setFont("helvetica", "normal")
        doc.text(format(now, "d 'de' MMMM 'de' yyyy", { locale: es }), 190, 30, { align: "right" })

        // Pink ID/Subtitle
        doc.setFontSize(10)
        doc.setTextColor(255, 12, 96) // #FF0C60
        doc.setFont("helvetica", "bold")
        doc.text("SEMANAL", 20, 36)

        // ---------------- INFO GENERAL ----------------
        doc.setFontSize(12)
        doc.setTextColor(255, 12, 96)
        doc.text("INFORMACIÓN GENERAL", 20, 55)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.1)
        doc.line(20, 58, 190, 58)

        // Data Grid
        doc.setFontSize(9)
        doc.setTextColor(150, 150, 150)
        doc.setFont("helvetica", "bold")
        doc.text("PERIODO", 20, 70)
        doc.text("TOTAL OPERADORES", 110, 70) // Right col

        doc.setFontSize(11)
        doc.setTextColor(50, 50, 50)
        doc.setFont("helvetica", "normal")
        doc.text(`${format(start, "d 'de' MMMM", { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}`, 20, 76)
        doc.text(`${operators.length}`, 110, 76)

        doc.setFontSize(9)
        doc.setTextColor(150, 150, 150)
        doc.setFont("helvetica", "bold")
        doc.text("TOTAL TAREAS", 20, 90)

        doc.setFontSize(11)
        doc.setTextColor(50, 50, 50)
        doc.setFont("helvetica", "normal")
        doc.text(`${tasks.length}`, 20, 96)

        // ---------------- HIGHLIGHT BOX (Grey Background) ----------------
        const bestPerformer = stats.length > 0 ? stats[0] : null

        if (bestPerformer) {
            doc.setFillColor(248, 249, 250) // #F8F9FA Very Light Grey
            doc.roundedRect(20, 110, 170, 35, 3, 3, "F")

            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.setFont("helvetica", "bold")
            doc.text("MEJOR RENDIMIENTO SEMANAL:", 35, 122)

            doc.setFontSize(14)
            doc.setTextColor(255, 12, 96)
            doc.text(`${bestPerformer.name}`, 35, 132)

            doc.setFontSize(12)
            doc.setTextColor(50, 50, 50)
            doc.text(`${bestPerformer.percentage}% Cumplimiento`, 110, 132)
        }

        // ---------------- TABLE DETAIL ----------------
        doc.setFontSize(12)
        doc.setTextColor(255, 12, 96)
        doc.setFont("helvetica", "bold")
        doc.text("DETALLE DEL EQUIPO", 20, 165)
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 168, 190, 168)

        const tableData = stats.map(s => [
            s.name,
            s.total,
            s.completed,
            s.incomplete,
            s.pending,
            `${s.percentage}%`
        ])

        autoTable(doc, {
            head: [['OPERADOR', 'TOTAL', 'COMPLETADAS', 'JUSTIFICADAS', 'PENDIENTES', 'RENDIMIENTO']],
            body: tableData,
            startY: 175,
            theme: 'plain',
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [100, 100, 100],
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'left'
            },
            styles: {
                fontSize: 10,
                cellPadding: 5,
                textColor: [80, 80, 80],
                lineColor: [240, 240, 240],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                lineWidth: { bottom: 0.1 } as any
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50, textColor: [50, 50, 50] },
                5: { fontStyle: 'bold', halign: 'right' }
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 5) {
                    const val = parseInt(data.cell.raw as string)
                    if (val >= 80) data.cell.styles.textColor = [22, 163, 74]
                    else if (val >= 50) data.cell.styles.textColor = [234, 179, 8]
                    else data.cell.styles.textColor = [220, 38, 38]
                }
            }
        })

        // -- Footer --
        const pageHeight = doc.internal.pageSize.height
        doc.setDrawColor(255, 12, 96)
        doc.setLineWidth(0.5)
        doc.line(20, pageHeight - 20, 190, pageHeight - 20) // Pink Bottom Line

        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text("Generado automáticamente por Sistema de Control Master", 20, pageHeight - 12)
        doc.text("CONFIDENCIAL", 190, pageHeight - 12, { align: "right" })

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // 5. Send Email (Professional - No Emojis - Minimal)
        await sendEmail({
            to: recipients,
            subject: `Reporte de Rendimiento: ${format(start, "d MMM")} - ${format(end, "d MMM")}`,
            html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta name="color-scheme" content="light only">
                    <meta name="supported-color-schemes" content="light only">
                    <style>
                        :root { color-scheme: light only; supported-color-schemes: light only; }
                        body { margin: 0; padding: 0; background-color: #f8fafc !important; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #334155; -webkit-font-smoothing: antialiased; }
                        .outer-wrapper { background-color: #f8fafc !important; }
                        .container { max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff !important; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
                        .accent-bar { height: 4px; background-color: #FF0C60; }
                        .header { padding: 32px 40px; border-bottom: 1px solid #f1f5f9; text-align: left; background-color: #ffffff; }
                        .brand { color: #FF0C60; font-weight: 800; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px; }
                        .title { margin: 0; color: #1e293b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
                        .content { padding: 40px; background-color: #ffffff; }
                        .intro { font-size: 15px; color: #475569; margin: 0 0 24px 0; line-height: 1.6; text-align: left; }
                        .date-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 32px; text-align: center; }
                        .date-text { color: #1e293b; font-weight: 600; font-size: 15px; letter-spacing: -0.2px; }
                        .footer { padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
                        .footer-text { margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5; }
                        
                        @media only screen and (max-width: 600px) {
                            .outer-padding { padding: 16px !important; }
                            .container { border-radius: 12px !important; }
                            .content, .header, .footer { padding: 24px !important; }
                        }
                    </style>
                </head>
                <body bgcolor="#f8fafc">
                    <table class="outer-wrapper" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="table-layout: fixed;">
                        <tr>
                            <td align="center" class="outer-padding" style="padding: 40px 10px;">
                                <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 600px; width: 100%; border-radius: 12px; border: 1px solid #e2e8f0;">
                                    <tr>
                                        <td>
                                            <div class="accent-bar"></div>
                                            <div class="header">
                                                <span class="brand">Control Master</span>
                                                <h1 class="title">Reporte de Rendimiento Semanal</h1>
                                            </div>

                                            <div class="content">
                                                <p class="intro">
                                                    Hola,
                                                    <br><br>
                                                    Se ha generado el reporte consolidado de rendimiento correspondiente al periodo:
                                                </p>
                                                
                                                <div class="date-box" bgcolor="#f8fafc">
                                                    <span class="date-text">${format(start, "d 'de' MMMM", { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}</span>
                                                </div>

                                                <p class="intro" style="margin-bottom: 0; font-size: 14px;">
                                                    El documento PDF adjunto contiene el análisis detallado de cumplimiento, tareas completadas y métricas de rendimiento por operador.
                                                </p>
                                            </div>

                                            <div class="footer" bgcolor="#f8fafc">
                                                <p class="footer-text">
                                                    Sistema de Control Master • Generado Automáticamente<br/>
                                                    <span style="opacity: 0.8;">© ${new Date().getFullYear()} Enlace - Control Master</span>
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
             `,
            attachments: [
                {
                    filename: `Reporte_Semanal_${format(start, 'yyyy-MM-dd')}.pdf`,
                    content: pdfBuffer
                }
            ]
        })

        return NextResponse.json({ success: true, count: stats.length })

    } catch (error) {
        console.error('[Weekly Report] Error:', error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
