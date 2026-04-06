import type { AiSuggestionContext } from './suggestions';

const GEMINI_API_KEY = 'AIzaSyBRQaIcMX-cOtjW2_IEvp-4bgGufADQBrQ';

export interface AiSuggestionResult {
  text: string;
  error?: string;
}

export async function fetchAiSuggestion(ctx: AiSuggestionContext): Promise<AiSuggestionResult> {
  const apiKey = GEMINI_API_KEY;
  const res = await fetch('/api/ai/suggest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gemini-key': apiKey,
    },
    body: JSON.stringify(ctx),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { text: '', error: data.error ?? `Request failed (${res.status})` };
  }

  const data = await res.json();
  return { text: data.text ?? '', error: data.error };
}
