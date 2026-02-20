import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const start = searchParams.get('start')
        const end = searchParams.get('end')

        if (!start || !end) return NextResponse.json([])

        const overrides = await prisma.workSchedule.findMany({
            where: {
                date: {
                    gte: new Date(start),
                    lte: new Date(end)
                },
                isOverride: true
            },
            include: { user: true }
        })

        return NextResponse.json(overrides)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { date, userId } = body 

        if (userId === 'reset') {
            await prisma.workSchedule.deleteMany({
                where: { date: new Date(date) }
            })
            return NextResponse.json({ success: true })
        }

        const override = await prisma.workSchedule.upsert({
            where: { date: new Date(date) },
            update: { userId, isOverride: true },
            create: { date: new Date(date), userId, isOverride: true }
        })

        return NextResponse.json(override)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
