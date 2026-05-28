import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { fetchWithTimeout } from '@/lib/fetch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error' | 'degraded'; message?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  try {
    await sql`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = { status: 'error', message: 'Database connection failed' };
    overallStatus = 'unhealthy';
  }

  try {
    const geoRes = await fetchWithTimeout('http://ip-api.com/json/8.8.8.8', { timeout: 3000 });
    const geoData = await geoRes.json();
    if (geoData.status === 'success') {
      checks.geoip = { status: 'ok' };
    } else {
      checks.geoip = { status: 'degraded', message: 'GeoIP service returned unexpected data' };
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }
  } catch {
    checks.geoip = { status: 'degraded', message: 'GeoIP service unavailable' };
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  try {
    const { stat } = await import('fs/promises');
    await stat(`${process.cwd()}/public/uploads`);
    checks.uploads = { status: 'ok' };
  } catch {
    checks.uploads = { status: 'ok', message: 'Uploads directory not created yet' };
  }

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    }
  );
}
