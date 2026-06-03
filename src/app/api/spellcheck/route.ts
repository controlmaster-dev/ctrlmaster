import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { ValidationError } from "@/lib/errors";

const spellcheckSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

const slangMap: Record<string, string> = {
  q: "que",
  k: "que",
  xq: "porque",
  x: "por",
  tmb: "también",
  ntp: "no te preocupes",
  pdo: "pasado",
  bn: "bien",
  vdd: "verdad",
};

export const POST = apiHandler(
  { auth: true, bodySchema: spellcheckSchema },
  async ({ body }) => {
    let text = body.text.charAt(0).toUpperCase() + body.text.slice(1);

    text = text
      .split(/\s+/)
      .map((word: string) => {
        const lower = word.toLowerCase().replace(/[.,!]/g, "");
        if (slangMap[lower]) {
          const punct = word.match(/[.,!]+$/)?.[0] || "";
          return slangMap[lower] + punct;
        }
        return word;
      })
      .join(" ");

    const params = new URLSearchParams();
    params.append("text", text);
    params.append("language", "es");

    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params,
    });

    if (!response.ok) {
      throw new ValidationError("Spellcheck service unavailable");
    }

    const result = await response.json();
    let correctedText = text;
    const matches = result.matches || [];

    type LtMatch = {
      replacements?: { value: string }[];
      offset: number;
      length: number;
    };

    const fixableMatches = (matches as LtMatch[]).filter(
      (m) => m.replacements && m.replacements.length > 0
    );
    for (let i = fixableMatches.length - 1; i >= 0; i--) {
      const match = fixableMatches[i];
      const replacement = match.replacements![0].value;
      correctedText =
        correctedText.substring(0, match.offset) +
        replacement +
        correctedText.substring(match.offset + match.length);
    }

    return { correctedText, matches: result.matches };
  }
);
