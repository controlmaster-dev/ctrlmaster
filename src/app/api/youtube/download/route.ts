import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Resolution issue in some environments, but works at runtime in Next.js
import { YtdlCore } from '@ybd-project/ytdl-core/serverless';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const type = searchParams.get('type') || 'audio'; // 'audio' or 'video'

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  if (!YtdlCore.validateURL(url)) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  const ytdl = new YtdlCore({
    fetcher: fetch,
  });

  try {
    console.log(`[YouTube] Downloading ${type}: ${url}`);
    const info = await ytdl.getBasicInfo(url, {
      clients: ['tv', 'ios', 'android', 'mweb'],
    });
    const isVideo = type === 'video';
    const title = info.videoDetails.title.replace(/[^\w\s-]/gi, '').trim() || (isVideo ? 'video' : 'audio');
    const filename = `${title}.${isVideo ? 'mp4' : 'm4a'}`;

    console.log(`[YouTube] Info fetched: ${title}`);

    // Get the stream
    const stream = await ytdl.download(url, {
      filter: isVideo ? 'audioandvideo' : 'audioonly',
      quality: isVideo ? 'highest' : 'highestaudio',
      clients: ['tv', 'ios', 'android', 'mweb'],
    });

    console.log(`[YouTube] Stream started for: ${filename}`);

    return new Response(stream, {
      headers: {
        'Content-Type': isVideo ? 'video/mp4' : 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error(`[YouTube ERROR] ${type} download failed:`, error);
    return NextResponse.json({ 
      error: `Failed to download ${type}. URL might be restricted or video too long.`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
