import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';
import { getBooleanSetting, setSetting } from '@/lib/appSettings';

export const dynamic = 'force-dynamic';

const PLATFORM_KEYS: Record<string, string> = {
  youtube: 'YOUTUBE_MANUAL_LIVE',
  facebook: 'FACEBOOK_MANUAL_LIVE',
};

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const [youtube, facebook] = await Promise.all([
      getBooleanSetting('YOUTUBE_MANUAL_LIVE'),
      getBooleanSetting('FACEBOOK_MANUAL_LIVE'),
    ]);

    return NextResponse.json({ youtube, facebook });
  } catch (error) {
    console.error('[social/toggle] GET error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateApiAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleResult = requireRole(authResult.user, ['ADMIN', 'BOSS', 'ENGINEER']);
    if (roleResult instanceof NextResponse) return roleResult;

    const { platform, enabled } = await request.json();

    const key = PLATFORM_KEYS[platform];
    if (!key) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    await setSetting(key, enabled ? 'true' : 'false');

    return NextResponse.json({
      success: true,
      message: `${platform} monitor ${enabled ? 'enabled' : 'disabled'}.`,
    });
  } catch (error) {
    console.error('[social/toggle] POST error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
