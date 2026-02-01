import { NextResponse } from 'next/server';

export async function GET() {
    const YT_CHANNEL_ID = 'UCtdHNT3FYl5oc7v1oskf7iZ'; // Trivisión CR
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YT_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;

        console.log('Testing API URL:', apiUrl.replace(YOUTUBE_API_KEY || '', 'API_KEY_HIDDEN'));

        const ytRes = await fetch(apiUrl);
        const data = await ytRes.json();

        return NextResponse.json({
            status: ytRes.status,
            hasApiKey: !!YOUTUBE_API_KEY,
            channelId: YT_CHANNEL_ID,
            itemsCount: data.items?.length || 0,
            isLive: data.items && data.items.length > 0,
            response: data,
            error: data.error || null
        });

    } catch (error) {
        return NextResponse.json({
            error: String(error),
            hasApiKey: !!YOUTUBE_API_KEY
        }, { status: 500 });
    }
}
