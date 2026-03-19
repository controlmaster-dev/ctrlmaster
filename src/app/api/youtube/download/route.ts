import { NextRequest, NextResponse } from 'next/server';
import { YtdlCore } from '@ybd-project/ytdl-core';

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
    const info = await ytdl.getBasicInfo(url, {
      clients: ['web', 'webCreator', 'android', 'ios', 'mweb'],
    });
    const isVideo = type === 'video';
    const title = info.videoDetails.title.replace(/[^\w\s-]/gi, '').trim() || (isVideo ? 'video' : 'audio');
    const filename = `${title}.${isVideo ? 'mp4' : 'm4a'}`;

    // Get the stream
    const stream = await ytdl.download(url, {
      filter: isVideo ? 'audioandvideo' : 'audioonly',
      quality: isVideo ? 'highest' : 'highestaudio',
      clients: ['web', 'webCreator', 'android', 'ios', 'mweb'],
    });

    return new Response(stream, {
      headers: {
        'Content-Type': isVideo ? 'video/mp4' : 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error(`Error downloading YouTube ${type}:`, error);
    return NextResponse.json({ 
      error: `Failed to download ${type}. URL might be restricted or video too long.`,
      details: String(error)
    }, { status: 500 });
  }
}
