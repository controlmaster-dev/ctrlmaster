import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET() {
  try {
    const programs = await prisma.validProgram.findMany({
      select: { code: true },
      orderBy: { code: 'asc' }
    });


    return NextResponse.json(programs.map((p) => p.code));
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text && text !== "") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }


    const codes = text.
    split(/[\n,]+/).
    map((s) => s.trim().toUpperCase()).
    filter((s) => s.length > 0 && /^[A-Z0-9]+$/.test(s));























    const uniqueCodes = Array.from(new Set(codes));

    await prisma.$transaction([
    prisma.validProgram.deleteMany({}),
    prisma.validProgram.createMany({
      data: uniqueCodes.map((code) => ({ code }))
    })]
    );

    return NextResponse.json({ success: true, count: codes.length });

  } catch (error) {
    console.error("Error updating knowledge base:", error);
    return NextResponse.json({ error: "Failed to update knowledge base" }, { status: 500 });
  }
}