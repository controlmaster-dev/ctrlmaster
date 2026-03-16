import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        operatorName: true,
        operatorEmail: true,
        problemDescription: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        dateStarted: true,
        dateResolved: true,
        emailStatus: true,
        emailRecipients: true,

        _count: {
          select: { comments: true, reactions: true }
        }
      }
    });
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { operatorId, operatorName, operatorEmail, problemDescription, category, priority, status, dateStarted, dateResolved, emailStatus, emailRecipients } = body;
    const newReport = await prisma.report.create({
      data: {
        operatorId,
        operatorName,
        operatorEmail,
        problemDescription,
        category,
        priority,
        status,
        emailStatus: emailStatus || 'none',
        emailRecipients,
        dateStarted: new Date(dateStarted),
        dateResolved: dateResolved ? new Date(dateResolved) : null,
        attachments: {
          create: (body.attachments || []).map((a) => ({
            url: a.url,
            type: a.type,
            data: a.data
          }))
        }
      }
    });
    return NextResponse.json(newReport);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Report ID required" }, { status: 400 });
    }

    await prisma.report.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status,
        dateResolved: status === 'resolved' ? new Date() : null
      }
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}