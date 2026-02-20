import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, type, description, timestamp } = body

        if (!type) {
            return NextResponse.json({ error: "Missing type" }, { status: 400 })
        }

        let user;

        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } })
        } else {
            // Public Fallback: Find a BOSS or Admin to attribute the report to
            // This allows the public monitoring screen to log issues "on behalf of" the system/admin
            user = await prisma.user.findFirst({
                where: { role: 'BOSS' }
            })
        }

        if (!user) return NextResponse.json({ error: "No user found to assign report" }, { status: 404 })

        const newReport = await prisma.report.create({
            data: {
                // Schema Mapping
                operatorId: user.id,
                operatorName: user.name,
                operatorEmail: user.email,

                // Combining Type + Description into problemDescription because 'title' doesn't exist
                problemDescription: `[ALERTA MONITOR] ${type.replace('_', ' ')}: ${description || 'Sin detalles'}`,

                category: 'INCIDENCIA',
                priority: 'ALTA',
                status: 'PENDIENTE',
                dateStarted: new Date(timestamp || new Date()),
                // dateResolved: null
            }
        })

        return NextResponse.json(newReport)

    } catch (error) {
        console.error("Quick Report Error:", error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
