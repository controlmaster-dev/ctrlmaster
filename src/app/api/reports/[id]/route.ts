import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const report = await prisma.report.findUnique({
            where: { id },
            include: {
                comments: { include: { author: true, reactions: true }, orderBy: { createdAt: 'asc' } },
                reactions: { include: { author: true } },
                views: { include: { user: true } },
                attachments: true,
                operator: true
            }
        })

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 })
        }

        return NextResponse.json(report)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
