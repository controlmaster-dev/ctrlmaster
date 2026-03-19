import { NextRequest, NextResponse } from 'next/server';
import { YtdlCore } from '@ybd-project/ytdl-core';

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
      clients: ['web', 'webCreator', 'android', 'ios', 'mweb'], // Multiple clients increase chance of success
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
