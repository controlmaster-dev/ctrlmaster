import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const roleResult = requireRole(authResult.user, ['ADMIN', 'BOSS', 'ENGINEER']);
    if (roleResult instanceof NextResponse) return roleResult;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("No RESEND_API_KEY found in environment");
      return NextResponse.json({ data: [] });
    }

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