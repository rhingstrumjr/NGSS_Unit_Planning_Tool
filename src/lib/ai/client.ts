import type { AiSuggestionContext } from './suggestions';

const API_KEY_STORAGE = 'ngss-gemini-key';

function getStoredKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(API_KEY_STORAGE) ?? '';
}

export interface AiSuggestionResult {
  text: string;
  error?: string;
}

export async function fetchAiSuggestion(ctx: AiSuggestionContext): Promise<AiSuggestionResult> {
  const apiKey = getStoredKey();
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
