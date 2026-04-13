import { NextResponse } from 'next/server';
import { checkMultiviewStatus } from '@/lib/monitor';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log("[Cron] Starting Multiview Monitor...");
    const result = await checkMultiviewStatus();

    if (result.status === 'ERROR' || result.status === 'WARNING') {
      const admin = await prisma.user.findFirst({ 
        where: { role: { in: ['BOSS', 'ADMIN'] } } 
      });

      if (admin) {
        const recentReport = await prisma.report.findFirst({
          where: {
            dateStarted: { gt: new Date(Date.now() - 60 * 60 * 1000) }, // 1 hour buffer
            operatorName: "Monitoreo Automático"
          }
        });

        if (!recentReport) {
          await prisma.report.create({
            data: {
              operatorId: admin.id,
              operatorName: "Monitoreo Automático",
              operatorEmail: "bot@enlace.org",
              problemDescription: `[ALERTA MULTIVIEW] ${result.details}`,
              category: 'SISTEMA',
              priority: 'ALTA', // Monitoring failures should be High
              status: 'pending',
              dateStarted: new Date()
            }
          });
          console.log("[Cron] Report created.");
        } else {
          console.log("[Cron] Skipping report creation (active report exists).");
        }
      } else {
        console.warn("[Cron] No admin user found for sending monitoring alerts.");
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("[Cron] Monitor failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}