// ── Optional real-AI mode ────────────────────────────────────────────────
// When OPENAI_API_KEY is set, the deterministic engine still owns ALL
// business logic (state transitions, scoring, matching). The model is used
// ONLY to rephrase the deterministic reply into more natural English.
// Any failure falls back silently to the deterministic copy.

import type { QualificationState } from "@/lib/types";

export function isAiModeEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function polishReply(
  deterministicText: string,
  state: QualificationState
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return deterministicText;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 160,
        messages: [
          {
            role: "system",
            content:
              "You are Maya, the property concierge for Vertice Realty in São Paulo. " +
              "Rewrite the deterministic message below in warm, natural, professional English, " +
              "in no more than 2 sentences. Do not invent facts, properties, prices, or new questions. " +
              "Do not mention lead scores. Preserve the original meaning.",
          },
          {
            role: "user",
            content: `Qualification state: ${JSON.stringify(state)}\n\nMessage to rewrite: "${deterministicText}"`,
          },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return deterministicText;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    return content && content.length > 4 ? content : deterministicText;
  } catch {
    return deterministicText;
  }
}
