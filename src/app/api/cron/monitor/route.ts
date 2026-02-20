import { NextResponse } from 'next/server'
import { checkMultiviewStatus } from '@/lib/monitor'
import prisma from '@/lib/prisma'

// Allow Cron to trigger this (e.g. every 5 or 10 mins)
export async function GET() {
    try {
        console.log("[Cron] Starting Multiview Monitor...")
        const result = await checkMultiviewStatus()

        if (result.status === 'ERROR' || result.status === 'WARNING' || result.status === 'OK') {
            // Find System User (Boss)
            const admin = await prisma.user.findFirst({ where: { role: 'BOSS' } })

            if (admin) {
                // Check if there's already a recent active report to avoid spamming
                const recentReport = await prisma.report.findFirst({
                    where: {
                        dateStarted: { gt: new Date(Date.now() - 20 * 60 * 1000) }, // Last 20 mins (User requested 20m)
                        operatorName: "Monitoreo Automático"
                    }
                })

                if (!recentReport) {
                    await prisma.report.create({
                        data: {
                            operatorId: admin.id,
                            operatorName: "Monitoreo Automático",
                            operatorEmail: "bot@enlace.org",
                            problemDescription: `[REPORTE DIARIO] ${result.details}`,
                            category: 'SISTEMA',
                            priority: 'BAJA', // User requested regular/low priority
                            status: 'PENDIENTE',
                            dateStarted: new Date()
                        }
                    })
                    console.log("[Cron] Report created.")
                } else {
                    console.log("[Cron] Skipping report creation (active report exists).")
                }
            }
        }

        return NextResponse.json({ success: true, result })
    } catch (error) {
        console.error("[Cron] Monitor failed:", error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
