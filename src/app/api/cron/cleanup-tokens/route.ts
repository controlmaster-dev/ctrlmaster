


import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredTokens } from '@/lib/auth';
import { requireCronAuth } from '@/lib/apiAuth';
import { logger, serializeError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const cronCheck = requireCronAuth(req);
  if (cronCheck) return cronCheck;

  try {
    const deletedCount = await cleanupExpiredTokens();

    logger.info('cron_cleanup_tokens', { deletedCount });

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('cron_cleanup_tokens_failed', serializeError(error));
    return NextResponse.json(
      { error: 'Error cleaning up tokens' },
      { status: 500 }
    );
  }
}
