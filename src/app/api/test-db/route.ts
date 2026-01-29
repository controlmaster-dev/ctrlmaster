import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        // Simple query to test connection
        const count = await prisma.user.count()
        return NextResponse.json({
            status: "success",
            message: "Database connection successful",
            userCount: count,
            env: process.env.NODE_ENV,
            dbUrlProvided: !!process.env.DATABASE_URL
        })
    } catch (error) {
        console.error("Test DB Error:", error)
        return NextResponse.json({
            status: "error",
            error: "Database connection failed",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
