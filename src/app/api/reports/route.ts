import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const reports = await prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                comments: { include: { author: true, reactions: true }, orderBy: { createdAt: 'asc' } },
                reactions: { include: { author: true } },
                views: { include: { user: true } },
                attachments: true
            }
        })
        return NextResponse.json(reports)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { operatorId, operatorName, operatorEmail, problemDescription, category, priority, status, dateStarted, dateResolved } = body
        const newReport = await prisma.report.create({
            data: {
                operatorId,
                operatorName,
                operatorEmail,
                problemDescription,
                category,
                priority,
                status,
                dateStarted: new Date(dateStarted),
                dateResolved: dateResolved ? new Date(dateResolved) : null,
                attachments: {
                    create: body.attachments || [] // Expects [{ url, type }]
                }
            }
        })
        return NextResponse.json(newReport)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "Report ID required" }, { status: 400 })
        }

        await prisma.report.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const updatedReport = await prisma.report.update({
            where: { id },
            data: {
                status,
                dateResolved: status === 'resolved' ? new Date() : null
            }
        })

        return NextResponse.json(updatedReport)
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
