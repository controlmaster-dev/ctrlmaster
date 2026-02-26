import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { channel, type, value } = body;

    const metric = await prisma.streamMetric.create({
      data: {
        channel,
        type,
        value
      }
    });

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error saving stream metric:', error);
    return NextResponse.json({ error: 'Failed to save metric' }, { status: 500 });
  }
}