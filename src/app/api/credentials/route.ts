import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const credentials = await prisma.credential.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Error fetching credentials' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, category, username, password, notes } = body;

    if (!service || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newCredential = await prisma.credential.create({
      data: {
        service,
        category: category || 'General',
        username,
        password,
        notes
      }
    });
    return NextResponse.json(newCredential);
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json({ error: 'Error creating credential' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.credential.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Error deleting credential' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    const { service, category, username, password, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const updated = await prisma.credential.update({
      where: { id },
      data: {
        service,
        category: category || 'General',
        username,
        password,
        notes
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json({ error: 'Error updating credential' }, { status: 500 });
  }
}