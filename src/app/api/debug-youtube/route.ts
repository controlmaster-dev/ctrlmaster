import { NextResponse } from 'next/server';

export async function GET() {
    const YT_CHANNEL_ID = 'UC0qFX9cnDZCMSJriRqcN37A'; // Enlace TV

    try {
        const ytRes = await fetch(`https://www.youtube.com/channel/${YT_CHANNEL_ID}/live`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = await ytRes.text();

        // Extract relevant parts
        const hasIsLive = html.includes('"isLive":true');
        const hasIsLiveNow = html.includes('"isLiveNow":true');
        const hasBadge = html.includes('BADGE_STYLE_TYPE_LIVE_NOW');
        const hasLiveText = html.includes('LIVE');

        // Get a sample of the HTML around "isLive"
        const isLiveIndex = html.indexOf('"isLive"');
        const sample = isLiveIndex > -1 ? html.substring(isLiveIndex, isLiveIndex + 200) : 'NOT FOUND';

        return NextResponse.json({
            status: ytRes.status,
            hasIsLive,
            hasIsLiveNow,
            hasBadge,
            hasLiveText,
            sample,
            htmlLength: html.length
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
