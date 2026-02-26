import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = await readFile(envPath, 'utf-8');

    const youtubeMatch = envContent.match(/YOUTUBE_MANUAL_LIVE=(true|false)/);
    const facebookMatch = envContent.match(/FACEBOOK_MANUAL_LIVE=(true|false)/);

    return NextResponse.json({
      youtube: youtubeMatch ? youtubeMatch[1] === 'true' : false,
      facebook: facebookMatch ? facebookMatch[1] === 'true' : false
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { platform, enabled } = await request.json();

    if (!['youtube', 'facebook'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const envPath = join(process.cwd(), '.env');
    let envContent = await readFile(envPath, 'utf-8');

    const varName = platform === 'youtube' ? 'YOUTUBE_MANUAL_LIVE' : 'FACEBOOK_MANUAL_LIVE';
    const regex = new RegExp(`${varName}=(true|false)`, 'g');

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${varName}=${enabled}`);
    } else {
      envContent += `\n${varName}=${enabled}`;
    }

    await writeFile(envPath, envContent, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `${platform} monitor ${enabled ? 'enabled' : 'disabled'}. Restart required.`
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}