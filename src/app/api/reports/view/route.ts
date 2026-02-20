import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { reportId, userId } = body

        if (!reportId || !userId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        // Upsert view
        // We generally just want to ensure it exists.
        // If unique constraint [userId, reportId], using upsert or just create-ignore (but create throws).
        // upsert is safest.

        await prisma.reportView.upsert({
            where: {
                userId_reportId: {
                    userId,
                    reportId
                }
            },
            update: {
                viewedAt: new Date()
            },
            create: {
                userId,
                reportId
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
