import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const type = searchParams.get('type') || 'audio'; // 'audio' or 'video'

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    console.log(`[YouTube] Downloading via Cobalt (${type}): ${url}`);
    
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        downloadMode: type === 'video' ? 'video' : 'audio',
        videoQuality: '720', // Best for Vercel/speed
        audioFormat: 'm4a',
        filenamePattern: 'basic'
      })
    });

    const data = await cobaltRes.json();

    if (data.status === 'error') {
      throw new Error(data.text || 'Error from Cobalt API');
    }

    if (data.url) {
      console.log(`[YouTube] Cobalt URL obtained: ${data.url}`);
      // Redirecting to the direct download link is the most reliable way on Vercel
      // to avoid timeouts and memory limits
      return NextResponse.redirect(data.url);
    }

    if (data.status === 'stream') {
        return NextResponse.redirect(data.url);
    }

    throw new Error('No download URL returned from API');
  } catch (error) {
    console.error(`[YouTube ERROR] Download failed:`, error);
    return NextResponse.json({ 
      error: `Error al procesar la descarga. YouTube está bloqueando servidores de Vercel.`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
