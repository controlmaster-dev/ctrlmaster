import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, path } = body

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                currentPath: path,
                lastActive: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Error updating heartbeat" }, { status: 500 })
    }
}
