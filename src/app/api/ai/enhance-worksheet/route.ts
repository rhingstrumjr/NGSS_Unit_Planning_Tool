import { NextRequest, NextResponse } from 'next/server';
import {
  buildEnhancementPrompt,
  EnhanceWorksheetRequest,
  EnhanceWorksheetResponse,
  ENHANCE_RESPONSE_SCHEMA,
  ENHANCE_DEFAULT_MODEL,
} from '@/lib/ai/worksheet-enhancer';

function getApiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured on server.' }, { status: 500 });
  }

  let body: EnhanceWorksheetRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.originalText?.trim()) {
    return NextResponse.json({ error: 'Worksheet text is required.' }, { status: 400 });
  }

  if (!body.strategies?.length) {
    return NextResponse.json({ error: 'At least one enhancement strategy is required.' }, { status: 400 });
  }

  const model = body.model || ENHANCE_DEFAULT_MODEL;
  const { system, user } = buildEnhancementPrompt(body);

  try {
    const res = await fetch(`${getApiUrl(model)}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: ENHANCE_RESPONSE_SCHEMA,
          maxOutputTokens: 8192,
          temperature: 0.8,
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

    let parsed: EnhanceWorksheetResponse;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI returned malformed JSON. Try again.' }, { status: 500 });
    }

    // Ensure changeLog is always an array
    if (!Array.isArray(parsed.changeLog)) {
      parsed.changeLog = [];
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
