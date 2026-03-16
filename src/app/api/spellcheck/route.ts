import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    let { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const slangMap = {
      'q': 'que', 'k': 'que', 'xq': 'porque', 'x': 'por', 'tmb': 'también',
      'ntp': 'no te preocupes', 'pdo': 'pasado', 'bn': 'bien', 'vdd': 'verdad'
    };


    text = text.charAt(0).toUpperCase() + text.slice(1);


    text = text.split(/\s+/).map((word) => {
      const lower = word.toLowerCase().replace(/[.,!]/g, '');
      if (slangMap[lower]) {

        const punct = word.match(/[.,!]+$/)?.[0] || '';
        return slangMap[lower] + punct;
      }
      return word;
    }).join(' ');


    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', 'es');

    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API Error: ${response.statusText}`);
    }

    const result = await response.json();

    let correctedText = text;
    const matches = result.matches || [];


    const fixableMatches = matches.filter((m: { replacements?: { value: string }[], offset: number, length: number }) => m.replacements && m.replacements.length > 0);
    for (let i = fixableMatches.length - 1; i >= 0; i--) {
      const match = fixableMatches[i];
      const replacement = match.replacements[0].value;
      correctedText = correctedText.substring(0, match.offset) + replacement + correctedText.substring(match.offset + match.length);
    }

    return NextResponse.json({
      correctedText,
      matches: result.matches
    });

  } catch (error) {
    console.error("Spellcheck Error:", error);
    return NextResponse.json({ error: "Failed to check spelling" }, { status: 500 });
  }
}