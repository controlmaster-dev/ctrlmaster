import { NextResponse } from 'next/server';

export async function GET() {
  const YT_CHANNEL_ID = 'UC0qFX9cnDZCMSJriRqcN37A';
  const FB_PAGE_URL = 'https://www.facebook.com/enlacetv';
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  try {

    let isYoutubeLive = false;

    if (YOUTUBE_API_KEY) {

      try {

        let apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YT_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
        let ytRes = await fetch(apiUrl);

        if (ytRes.ok) {
          const data = await ytRes.json();

          if (data.error) {
            console.error('[YouTube API Error]', data.error.message);
          } else if (data.items && data.items.length > 0) {
            isYoutubeLive = true;
            console.log('[YouTube API Detection]', '✅ LIVE (via search)');
          } else {

            apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YT_CHANNEL_ID}&type=video&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;
            ytRes = await fetch(apiUrl);

            if (ytRes.ok) {
              const recentData = await ytRes.json();

              if (recentData.items && recentData.items.length > 0) {

                const liveVideo = recentData.items.find(
                  (item) => item.snippet.liveBroadcastContent === 'live'
                );

                if (liveVideo) {
                  isYoutubeLive = true;
                  console.log('[YouTube API Detection]', '✅ LIVE (via recent videos)');
                } else {
                  console.log('[YouTube API Detection]', '❌ OFFLINE');
                }
              } else {
                console.log('[YouTube API Detection]', '⚠️ No videos found for channel');
              }
            }
          }
        } else {
          console.error('YouTube API HTTP error:', ytRes.status);
        }
      } catch (err) {
        console.error('YouTube API detection error:', err);
      }
    } else {

      isYoutubeLive = process.env.YOUTUBE_MANUAL_LIVE === 'true';
      if (isYoutubeLive) {
        console.log('[YouTube Manual Override] ✅ SIMULATED LIVE');
      } else {
        console.log('[YouTube] ⚠️ No API Key - Set YOUTUBE_API_KEY in .env or YOUTUBE_MANUAL_LIVE=true to test');
      }
    }


    let isFacebookLive = false;


    const fbManualOverride = process.env.FACEBOOK_MANUAL_LIVE === 'true';

    if (fbManualOverride) {
      isFacebookLive = true;
      console.log('[Facebook Manual Override] ✅ SIMULATED LIVE');
    } else {

      try {
        const fbRes = await fetch(`${FB_PAGE_URL}/live/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          next: { revalidate: 60 }
        });

        if (fbRes.ok) {
          const html = await fbRes.text();
          isFacebookLive = html.includes('"is_live":true') ||
          html.includes('"isLiveStreaming":true') ||
          html.includes('LIVE') && html.includes('live_video') ||
          html.includes('live_broadcast');

          console.log('[Facebook Scraping]', isFacebookLive ? '✅ LIVE' : '❌ OFFLINE');
        }
      } catch (err) {
        console.error('Facebook detection error:', err);
      }
    }

    return NextResponse.json({
      youtube: {
        live: isYoutubeLive,
        url: isYoutubeLive ? `https://www.youtube.com/embed/live_stream?channel=${YT_CHANNEL_ID}` : null,
        method: YOUTUBE_API_KEY ? 'api' : 'manual'
      },
      facebook: {
        live: isFacebookLive,
        url: isFacebookLive ? `https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(FB_PAGE_URL)}/live/&show_text=false&width=560&t=0` : null,
        method: fbManualOverride ? 'manual' : 'scraping'
      }
    });

  } catch (error) {
    console.error('Error detecting social live status:', error);
    return NextResponse.json({
      youtube: { live: false },
      facebook: { live: false }
    }, { status: 500 });
  }
}