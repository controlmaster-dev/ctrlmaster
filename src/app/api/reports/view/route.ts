import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, userId } = body;

    if (!reportId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

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
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error recording report view:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}