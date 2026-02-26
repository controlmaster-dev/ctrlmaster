import puppeteer from 'puppeteer';
export async function checkMultiviewStatus() {
  let browser = null;
  try {
    console.log("[Monitor] Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'],

      executablePath: process.env.CHROME_PATH || undefined
    });

    const page = await browser.newPage();
    console.log("[Monitor] Navigating to login...");
    await page.goto('https://componentes.enlace.org/live/multiview/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.screenshot({ path: './public/monitor_login_page.png' });
    const email = process.env.MONITOR_USER || 'controlmaster';
    const password = process.env.MONITOR_PASS || 'Ae$QC9?3U';
    const emailInput = await page.$('input[placeholder="Usuario"]');
    if (emailInput) {
      console.log('[Monitor] Login form detected via Placeholders. Entering credentials...');
      await emailInput.type(email);
      await page.type('input[placeholder="Contraseña"]', password);


      const buttons = await page.$$("xpath///button[contains(., 'Ingresar')]");
      const button = buttons[0];

      if (button) {
        console.log("[Monitor] Clicking 'Ingresar' button...");
        await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch((e) => console.log("Nav timeout ignored", e)),
        button.click()]
        );
      } else {
        console.log("[Monitor] WARNING: 'Ingresar' button not found. Pressing Enter.");
        await page.keyboard.press('Enter');
        await new Promise((r) => setTimeout(r, 5000));
      }
    } else {
      console.log("[Monitor] No login inputs found. Assuming already logged in or different page structure.");
    }


    console.log("[Monitor] Waiting for video load...");

    await new Promise((r) => setTimeout(r, 10000));


    const screenshotPath = './public/monitor_result.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[Monitor] Result screenshot saved to ${screenshotPath}`);

    let totalVideos = 0;
    const allStatuses = [];
    const labelsList = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      return iframes.map((iframe, index) => {
        let label = `Canal ${index + 1}`;
        let wrapper = iframe.parentElement;
        for (let i = 0; i < 4; i++) {
          if (!wrapper) break;
          const text = wrapper.innerText || '';
          const lines = text.split('\n').
          map((l) => l.trim()).
          filter((l) => l.length > 0).
          filter((l) => !l.includes('0:00')).
          filter((l) => !l.toLowerCase().includes('calidad')).
          filter((l) => !l.toLowerCase().includes('auto')).
          filter((l) => !l.toLowerCase().includes('live streaming')).
          filter((l) => !l.includes('manifestLoadError')).
          filter((l) => !l.includes('networkError'));

          const candidate = lines.find((l) => /[a-zA-Z]/.test(l));
          if (candidate) {
            label = candidate.substring(0, 30);
            break;
          }
          wrapper = wrapper.parentElement;
        }
        return label;
      });
    });

    const frames = page.frames();
    console.log(`[Monitor] Inspecting ${frames.length} frames...`);

    let globalVideoCounter = 0;
    let iframeIndex = 0;

    for (const frame of frames) {
      try {


        const isMain = frame === page.mainFrame();
        const currentLabel = isMain ? "Main Page" : labelsList[iframeIndex] || `Canal ${iframeIndex + 1}`;

        const frameResult = await frame.evaluate((lbl) => {

          const docVideos = Array.from(document.querySelectorAll('video'));
          if (docVideos.length === 0) return null;

          const statuses = docVideos.map((v, index) => {
            const isPlaying = !v.paused && v.readyState >= 2;

            let finalLabel = lbl;
            if (docVideos.length > 1) finalLabel += ` (${index + 1})`;


            if (finalLabel.startsWith('Canal ')) {
            } else if (finalLabel === 'Main Page') {
              finalLabel = `Video Main ${index + 1}`;
            }

            const innerText = v.parentElement?.parentElement?.innerText || '';
            const hasError = innerText.includes('manifestLoadError') || innerText.includes('networkError');


            const hasAudio = !v.muted && v.volume > 0 && isPlaying && !hasError;

            return { label: finalLabel, isPlaying, hasError, hasAudio };
          });

          return { total: docVideos.length, statuses };
        }, currentLabel);

        if (frameResult) {
          totalVideos += frameResult.total;
          allStatuses.push(...frameResult.statuses);

          globalVideoCounter += frameResult.total;
        }

        if (!isMain) iframeIndex++;

      } catch (e) {

        if (frame !== page.mainFrame()) iframeIndex++;
      }
    }

    if (totalVideos === 0) {
      return { status: 'ERROR', type: 'CRITICAL', details: `No se encontraron reproductores de video.`, screenshotPath };
    }


    const lines = allStatuses.map((s) => {
      let statusText = '';
      if (s.hasError) statusText = 'Error de Señal';else
      if (!s.isPlaying) statusText = 'Congelado/Video Detenido';else
      statusText = 'Imagen OK';

      let audioText = 'Audio OK';
      if (!s.hasAudio) audioText = 'Sin Audio (Mute/0)';

      return `• ${s.label}: ${statusText} | ${audioText}`;
    });
    const realFailures = allStatuses.filter((s) => {
      const isDallas = s.label.toLowerCase().includes('dallas');
      if (isDallas) return false;
      return s.hasError || !s.isPlaying;
    });

    const realSilent = allStatuses.filter((s) => {
      const isDallas = s.label.toLowerCase().includes('dallas');
      if (isDallas) return false;
      return s.isPlaying && !s.hasAudio;
    });

    let status = 'OK';
    if (realFailures.length > 0 || realSilent.length > 0) {
      status = 'WARNING';
    }


    return {
      status,
      type: status === 'WARNING' ? 'PARTIAL_OUTAGE' : undefined,
      details: `Resumen:\n${lines.join('\n')}`,
      screenshotPath
    };

  } catch (error) {
    console.error("[Monitor] Error:", error);
    return { status: 'ERROR', details: error.message };
  } finally {
    if (browser) await browser.close();
  }
}