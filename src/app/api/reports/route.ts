import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createReportSchema, updateReportSchema } from '@/lib/validation';
import { ValidationError, ApiError } from '@/lib/errors';
import { validateApiAuth } from '@/lib/apiAuth';
import { sendWhatsApp } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 100;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        take: limit,
        skip,
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
            select: { comments: true, reactions: true },
          },
        },
      }),
      prisma.report.count(),
    ]);

    return NextResponse.json(reports, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const result = createReportSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de reporte inválidos', result.error.issues);
    }

    const {
      operatorId,
      operatorName,
      operatorEmail,
      problemDescription,
      category,
      priority,
      status,
      emailStatus,
      emailRecipients,
      dateStarted,
      dateResolved,
      attachments
    } = result.data;

    const newReport = await prisma.report.create({
      data: {
        operatorId,
        operatorName,
        operatorEmail: operatorEmail || "",
        problemDescription,
        category,
        priority,
        status: status as any,
        emailStatus: (emailStatus as any) || 'none',
        emailRecipients,
        dateStarted: new Date(dateStarted),
        dateResolved: dateResolved ? new Date(dateResolved) : null,
        attachments: attachments
          ? {
              create: attachments.map((attachment: any) => ({
                url: attachment.url,
                type: attachment.type,
                data: attachment.data,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json(newReport, { status: 201 });

  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Error al crear reporte' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de reporte es requerido' },
        { status: 400 }
      );
    }

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reporte' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const result = updateReportSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de actualización inválidos', result.error.issues);
    }

    const { id, status, dateResolved } = result.data;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'resolved' && !dateResolved) {
        updateData.dateResolved = new Date();
      }
    }

    if (dateResolved !== undefined) {
      updateData.dateResolved = dateResolved;
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedReport);

  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reporte' },
      { status: 500 }
    );
  }
}
