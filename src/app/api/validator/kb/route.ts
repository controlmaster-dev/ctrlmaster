import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const programs = await prisma.validProgram.findMany({
      select: { code: true },
      orderBy: { code: 'asc' }
    });

    return NextResponse.json(programs.map((p: any) => p.code));
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text;

    if (text === undefined || text === null) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const codes = (text as string)
      .split(/[\n,]+/)
      .map((s: string) => s.trim().toUpperCase())
      .filter((s: string) => s.length > 0 && /^[A-Z0-9]+$/.test(s));
      
    const uniqueCodes = Array.from(new Set(codes));

    await prisma.$transaction([
      prisma.validProgram.deleteMany({}),
      prisma.validProgram.createMany({
        data: uniqueCodes.map((code: string) => ({ code }))
      })
    ]);

    return NextResponse.json({ success: true, count: uniqueCodes.length });

  } catch (error) {
    console.error("Error updating knowledge base:", error);
    return NextResponse.json({ error: "Failed to update knowledge base" }, { status: 500 });
  }
}