import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const [result] = await sql`SELECT COUNT(*)::int AS count FROM "User"`;
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      userCount: result.count,
      env: process.env.NODE_ENV,
      dbUrlProvided: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error("Test DB Error:", error);
    return NextResponse.json({
      status: "error",
      error: "Database connection failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
