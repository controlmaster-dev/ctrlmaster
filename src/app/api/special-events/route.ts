import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: List all events
export async function GET() {
    try {
        const events = await prisma.specialEvent.findMany({
            orderBy: { startDate: 'desc' },
            include: {
                _count: { select: { shifts: true } }
            }
        })
        return NextResponse.json(events)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

// POST: Create new event
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, startDate, endDate } = body

        if (!name || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const event = await prisma.specialEvent.create({
            data: {
                name,
                startDate,
                endDate,
                isActive: true
            }
        })

        return NextResponse.json(event)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

// DELETE: Remove event
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        await prisma.specialEvent.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

// PATCH: Toggle active status or update details
export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { id, isActive, name, startDate, endDate } = body

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        const event = await prisma.specialEvent.update({
            where: { id },
            data: {
                isActive: isActive !== undefined ? isActive : undefined,
                name: name || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            }
        })

        return NextResponse.json(event)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
