/**
 * Cron job to clean up expired session tokens
 * Run daily at 3:00 AM (Costa Rica time)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredTokens } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
