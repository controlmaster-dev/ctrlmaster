/**
 * Health check endpoint
 * Returns service status and dependencies health
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchWithTimeout } from '@/lib/fetch';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Check overall service health
 */
export async function GET(req: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error' | 'degraded'; message?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: 'Database connection failed',
    };
    overallStatus = 'unhealthy';
  }

  // Check external services (GeoIP)
  try {
    const geoRes = await fetchWithTimeout('http://ip-api.com/json/8.8.8.8', {
      timeout: 3000,
    });
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

  // Check disk space (uploads directory)
  try {
    const { stat } = await import('fs/promises');
    const uploadDir = await stat(`${process.cwd()}/public/uploads`);
    checks.uploads = { status: 'ok' };
  } catch {
    checks.uploads = { status: 'ok', message: 'Uploads directory not created yet' };
  }

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      checks,
    },
    {
      status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
