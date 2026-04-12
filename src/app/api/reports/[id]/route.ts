import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        comments: { include: { author: true, reactions: true }, orderBy: { createdAt: 'asc' } },
        reactions: { include: { author: true } },
        views: { include: { user: true } },
        attachments: true,
        operator: true
      }
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}