
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
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; max-width: 600px;">
                    <h2 style="color: #333; border-bottom: 2px solid #FF0C60; padding-bottom: 10px;">Reporte Semanal Generado</h2>
                    <p style="font-size: 14px; line-height: 1.6; color: #555;">
                        Adjunto encontrará el reporte de rendimiento del equipo de Control Master correspondiente al periodo:
                    </p>
                    <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-weight: bold; color: #333;">
                        ${format(start, "d 'de' MMMM", { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}
                    </p>
                    <p style="font-size: 14px; color: #555;">
                        Este documento contiene el desglose detallado de tareas completadas, pendientes y justificadas por operador.
                    </p>
                    <br>
                    <div style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
                        Sistema de Control Master - Enlace<br>
                        Este mensaje fue enviado automáticamente. No responda a este correo.
                    </div>
                </div>
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
