import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const schedule = await prisma.weeklySchedule.findMany({
      include: { user: true }
    });
    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching schedule config' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { schedule } = body;

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const operations = [];

    for (const item of schedule) {
      if (item.userId === "REMOVE") {
        operations.push(prisma.weeklySchedule.deleteMany({
          where: { dayOfWeek: item.dayOfWeek }
        }));
      } else {
        operations.push(prisma.weeklySchedule.upsert({
          where: { dayOfWeek: item.dayOfWeek },
          update: { userId: item.userId },
          create: { dayOfWeek: item.dayOfWeek, userId: item.userId }
        }));
      }
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving schedule:", error);
    return NextResponse.json({ error: 'Error saving schedule' }, { status: 500 });
  }
}