import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request) {
    try {
        const credentials = await prisma.credential.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(credentials)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching credentials' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { service, category, username, password, notes } = body

        if (!service || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newCredential = await prisma.credential.create({
            data: {
                service,
                category: category || 'General',
                username,
                password,
                notes
            }
        })

        return NextResponse.json(newCredential)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating credential' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        await prisma.credential.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting credential' }, { status: 500 })
    }
}
