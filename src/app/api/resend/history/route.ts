import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("🔍 API /api/resend/history HIT");
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ No RESEND_API_KEY found in environment");
      return NextResponse.json({ data: [] });
    }

    console.log("🔑 API Key found (starts with):", apiKey.substring(0, 5) + "...");


    const res = await fetch('https://api.resend.com/emails', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("⚠️ Resend API Error (History):", res.status, text);

      return NextResponse.json({ data: [] });
    }

    const data = await res.json();
    console.log(`✅ Resend History: Found ${data?.data?.length || 0} emails`);

    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Error fetching Resend history:", error);
    return NextResponse.json({ data: [] });
  }
}