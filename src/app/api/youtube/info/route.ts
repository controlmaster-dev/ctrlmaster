import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - Resolution issue in some environments, but works at runtime in Next.js
import { YtdlCore } from '@ybd-project/ytdl-core/serverless';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

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
      clients: ['tv', 'ios', 'android', 'mweb'], // Prioritize non-web clients for serverless
    });

    const { videoDetails } = info;

    return NextResponse.json({
      title: videoDetails.title,
      author: videoDetails.author.name,
      thumbnails: videoDetails.thumbnails,
      duration: videoDetails.lengthSeconds,
      videoId: videoDetails.videoId,
    });
  } catch (error) {
    console.error('Error fetching YouTube info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video information. YouTube might be blocking the request.',
      details: String(error)
    }, { status: 500 });
  }
}
