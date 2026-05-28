import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { createReportSchema, updateReportSchema } from '@/lib/validation';
import { ValidationError, ApiError } from '@/lib/errors';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';
import { sendWhatsApp } from '@/lib/whatsapp';

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 500);
    const skip = (page - 1) * limit;

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const operator = searchParams.get('operator');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const [reports, totalResult] = await Promise.all([
      sql`
        SELECT
          r."id",
          r."operatorName",
          r."operatorEmail",
          r."problemDescription",
          r."category",
          r."priority",
          r."status",
          r."createdAt",
          r."dateStarted",
          r."dateResolved",
          r."emailStatus",
          r."emailRecipients",
          COALESCE(cc."commentCount", 0)::int AS "commentCount",
          COALESCE(rc."reactionCount", 0)::int AS "reactionCount"
        FROM "Report" r
        LEFT JOIN (
          SELECT "reportId", COUNT(*) AS "commentCount" FROM "Comment" GROUP BY "reportId"
        ) cc ON cc."reportId" = r."id"
        LEFT JOIN (
          SELECT "reportId", COUNT(*) AS "reactionCount" FROM "Reaction" GROUP BY "reportId"
        ) rc ON rc."reportId" = r."id"
        WHERE 1=1
        ${status && status !== 'all' ? sql`AND r."status" = ${status}` : sql``}
        ${priority && priority !== 'all' ? sql`AND r."priority" = ${priority}` : sql``}
        ${category && category !== 'all' ? sql`AND r."category" = ${category}` : sql``}
        ${operator ? sql`AND (r."operatorName" ILIKE ${'%' + operator + '%'} OR r."operatorEmail" ILIKE ${'%' + operator + '%'})` : sql``}
        ${search ? sql`AND (r."problemDescription" ILIKE ${'%' + search + '%'} OR r."operatorName" ILIKE ${'%' + search + '%'} OR r."id"::text ILIKE ${'%' + search + '%'})` : sql``}
        ${dateFrom ? sql`AND r."createdAt" >= ${new Date(dateFrom).toISOString()}` : sql``}
        ${dateTo ? sql`AND r."createdAt" <= ${new Date(dateTo).toISOString()}` : sql``}
        ORDER BY r."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      sql`
        SELECT COUNT(*)::int AS count FROM "Report" r
        WHERE 1=1
        ${status && status !== 'all' ? sql`AND r."status" = ${status}` : sql``}
        ${priority && priority !== 'all' ? sql`AND r."priority" = ${priority}` : sql``}
        ${category && category !== 'all' ? sql`AND r."category" = ${category}` : sql``}
        ${operator ? sql`AND (r."operatorName" ILIKE ${'%' + operator + '%'} OR r."operatorEmail" ILIKE ${'%' + operator + '%'})` : sql``}
        ${search ? sql`AND (r."problemDescription" ILIKE ${'%' + search + '%'} OR r."operatorName" ILIKE ${'%' + search + '%'} OR r."id"::text ILIKE ${'%' + search + '%'})` : sql``}
        ${dateFrom ? sql`AND r."createdAt" >= ${new Date(dateFrom).toISOString()}` : sql``}
        ${dateTo ? sql`AND r."createdAt" <= ${new Date(dateTo).toISOString()}` : sql``}
      `,
    ]);

    const total = totalResult[0]?.count ?? 0;

    // Map to match old Prisma shape (_count wrapper)
    const mapped = reports.map((r: any) => ({
      id: r.id,
      operatorName: r.operatorName,
      operatorEmail: r.operatorEmail,
      problemDescription: r.problemDescription,
      category: r.category,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt,
      dateStarted: r.dateStarted,
      dateResolved: r.dateResolved,
      emailStatus: r.emailStatus,
      emailRecipients: r.emailRecipients,
      _count: { comments: r.commentCount, reactions: r.reactionCount },
    }));

    return NextResponse.json({
      reports: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
      attachments,
    } = result.data;

    const [newReport] = await sql`
      INSERT INTO "Report" (
        "operatorId", "operatorName", "operatorEmail",
        "problemDescription", "category", "priority",
        "status", "emailStatus", "emailRecipients",
        "dateStarted", "dateResolved"
      )
      VALUES (
        ${operatorId}, ${operatorName}, ${operatorEmail || ''},
        ${problemDescription}, ${category}, ${priority},
        ${status}, ${emailStatus || 'none'}, ${emailRecipients || null},
        ${new Date(dateStarted).toISOString()},
        ${dateResolved ? new Date(dateResolved).toISOString() : null}
      )
      RETURNING *
    `;

    // Batch-insert attachments if provided (single round-trip instead of N).
    let createdAttachments: any[] = [];
    if (attachments && attachments.length > 0) {
      const rows = attachments.map((att) => ({
        url: att.url,
        type: att.type,
        data: att.data || null,
        reportId: newReport.id,
      }));
      createdAttachments = await sql`
        INSERT INTO "Attachment" ${sql(rows, 'url', 'type', 'data', 'reportId')}
        RETURNING *
      `;
    }

    return NextResponse.json({ ...newReport, attachments: createdAttachments }, { status: 201 });

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
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleResult = requireRole(authResult.user, ['ENGINEER', 'ADMIN', 'BOSS']);
    if (roleResult instanceof NextResponse) return roleResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de reporte es requerido' },
        { status: 400 }
      );
    }

    const [exists] = await sql`SELECT "id" FROM "Report" WHERE "id" = ${id} LIMIT 1`;
    if (!exists) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    await sql`DELETE FROM "Report" WHERE "id" = ${id}`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reporte' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
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
        updateData.dateResolved = new Date().toISOString();
      }
    }

    if (dateResolved !== undefined) {
      updateData.dateResolved = dateResolved;
    }

    // Build dynamic UPDATE
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const [updatedReport] = await sql`
      UPDATE "Report"
      SET ${sql(updateData)}
      WHERE "id" = ${id}
      RETURNING *
    `;

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
