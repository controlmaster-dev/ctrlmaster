import { NextRequest, NextResponse } from 'next/server';
import { YtdlCore } from '@ybd-project/ytdl-core';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const type = searchParams.get('type') || 'audio'; // 'audio' or 'video'

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const ytdl = new YtdlCore({
    fetcher: fetch,
  });

  try {
    console.log(`[YouTube] Direct download attempt (${type}): ${url}`);
    
    const options: any = {
      clients: ['ios', 'android'],
      disableDefaultClients: true,
      hl: 'es-419',
      gl: 'MX',
    };

    const info = await ytdl.getBasicInfo(url, options);
    const isVideo = type === 'video';
    const title = info.videoDetails.title.replace(/[^\w\s-]/gi, '').trim() || (isVideo ? 'video' : 'audio');
    const filename = `${title}.${isVideo ? 'mp4' : 'm4a'}`;

    // Get the stream
    const stream = await ytdl.download(url, {
      ...options,
      filter: isVideo ? 'audioandvideo' : 'audioonly',
      quality: isVideo ? 'highest' : 'highestaudio',
    });

    return new Response(stream, {
      headers: {
        'Content-Type': isVideo ? 'video/mp4' : 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error(`[YouTube ERROR] Download failed:`, error);
    return NextResponse.json({ 
      error: `YouTube está bloqueando este servidor. Intenta con otro video o inténtalo más tarde.`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
