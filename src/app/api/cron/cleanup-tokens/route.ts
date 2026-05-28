/**
 * Cron job to clean up expired session tokens
 * Run daily at 3:00 AM (Costa Rica time)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredTokens } from '@/lib/auth';
import { requireCronAuth } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const cronCheck = requireCronAuth(req);
  if (cronCheck) return cronCheck;

  try {
    const deletedCount = await cleanupExpiredTokens();

    console.log(`[Cron] Cleaned up ${deletedCount} expired session tokens`);

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error cleaning up tokens:', error);
    return NextResponse.json(
      { error: 'Error cleaning up tokens' },
      { status: 500 }
    );
  }
}
