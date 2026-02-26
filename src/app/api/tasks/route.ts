import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const dateStr = searchParams.get('date');

    console.log(`[API_GET] Fetching tasks for User=${userId} Date=${dateStr || 'ALL'}`);

    if (!userId) throw new Error("User ID required");

    let tasks: Array<{ id: string; title: string; scheduledDate: string; userId: string; priority: string; status: string; createdAt: Date; deadline: Date | null; comment: string | null; completedAt: Date | null }> = [];

    if (dateStr) {
      tasks = await prisma.task.findMany({
        where: {
          userId: userId,
          scheduledDate: dateStr
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      tasks = await prisma.task.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' }
      });
    }
    console.log(`[API_GET] Found ${tasks.length} tasks`);
    if (tasks.length === 0 && dateStr) {
      const allTaskCount = await prisma.task.count({ where: { userId } });
      if (allTaskCount > 0) {
        const sampleTasks = await prisma.task.findMany({
          where: { userId },
          take: 10,
          select: { scheduledDate: true, title: true }
        });
        console.log(`[API_DEBUG_MISMATCH] User has ${allTaskCount} total tasks. Sample Dates: ${sampleTasks.map((t) => t.scheduledDate).join(', ')}`);
      } else {
        const allUsers = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
        const userList = allUsers.map((u) => `${u.name}(${u.id})[${u.role}]`).join(', ');
        console.log(`[API_DEBUG_EMPTY] User '${userId}' has 0 tasks. VALID USERS IN DB: ${userList}`);
      }
    }

    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error(`[API_GET] Error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, tasks, dates } = body;

    console.log(`[API_POST] Creating tasks. User=${userId} Dates=${dates?.join(',')} TaskCount=${tasks?.length}`);

    if (!userId) throw new Error("User ID required");
    if (!Array.isArray(tasks) || !Array.isArray(dates)) throw new Error("Tasks and Dates arrays required");


    const operations = dates.flatMap((dateStr) => {
      return tasks.map((t: { title: string; deadline?: Date; priority?: "HIGH" | "MEDIUM" | "LOW" }) => prisma.task.create({
        data: {
          title: t.title,
          deadline: t.deadline || null,
          priority: t.priority || "MEDIUM",
          userId,
          scheduledDate: dateStr,
          status: 'PENDING'
        }
      }));
    });

    const result = await prisma.$transaction(operations);
    console.log(`[API_POST] Successfully created ${result.length} tasks.`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST Tasks Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status, comment } = body;


    const data: { comment?: string; status?: string; completedAt?: Date | null } = {};
    if (comment !== undefined) data.comment = comment;
    if (status !== undefined) {
      data.status = status;

      if (['COMPLETED', 'INCOMPLETE'].includes(status)) {
        data.completedAt = new Date();
      } else

        if (status === 'PENDING') {
          data.completedAt = null;
        }
    }

    const updated = await prisma.task.update({
      where: { id },
      data
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw new Error("ID Required");

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}