import { NextRequest, NextResponse } from 'next/server';
import { NGSS_STANDARDS } from '@/lib/ngss-standards';
import {
  buildUnitGenerationPrompt,
  GenerateUnitRequest,
  GenerateUnitResponse,
  UNIT_RESPONSE_SCHEMA,
  DEFAULT_MODEL,
} from '@/lib/ai/unit-generator';

function getApiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured on server.' }, { status: 500 });
  }

  let body: GenerateUnitRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const model = body.model || DEFAULT_MODEL;
  const { system, user } = buildUnitGenerationPrompt(body, NGSS_STANDARDS);

  try {
    const res = await fetch(`${getApiUrl(model)}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: UNIT_RESPONSE_SCHEMA,
          maxOutputTokens: 3000,
          temperature: 0.9,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } })?.error?.message ?? `Gemini API error (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const data = await res.json();
    // Thinking models (e.g. gemini-2.5-pro) return multiple parts: the thinking
    // chain first, then the actual response. Use the last part with text content.
    const parts: Array<{ text?: string }> = data?.candidates?.[0]?.content?.parts ?? [];
    const rawText: string = [...parts].reverse().find((p) => p.text)?.text ?? '';

    if (!rawText) {
      return NextResponse.json({ error: 'AI returned an empty response. Try again.' }, { status: 500 });
    }

    let parsed: GenerateUnitResponse;
    try {
      // responseMimeType: application/json should give us clean JSON, but strip fences as fallback
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI returned malformed JSON. Try again.' }, { status: 500 });
    }

    // Clamp dqIndex values to valid range
    if (Array.isArray(parsed.loops) && Array.isArray(parsed.subQuestions)) {
      const maxIdx = parsed.subQuestions.length - 1;
      parsed.loops = parsed.loops.map((loop) => ({
        ...loop,
        dqIndex: Math.max(0, Math.min(loop.dqIndex, maxIdx)),
      }));
    }

    // Ensure targets array length matches loops
    if (Array.isArray(parsed.loops)) {
      const loopCount = parsed.loops.length;
      if (!Array.isArray(parsed.targets)) parsed.targets = [];
      while (parsed.targets.length < loopCount) {
        parsed.targets.push(['Students can explain this concept.']);
      }
      parsed.targets = parsed.targets.slice(0, loopCount);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
