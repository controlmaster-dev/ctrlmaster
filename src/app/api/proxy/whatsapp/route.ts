/**
 * Proxy endpoint to check WhatsApp API health from the server
 * Avoids CORS issues when fetching from client-side
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const whatsappUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3001';
    
    // Short timeout to avoid blocking the page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${whatsappUrl}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, data: null },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, data: null },
      { status: 503 }
    );
  }
}
