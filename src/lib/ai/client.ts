import type { AiSuggestionContext } from './suggestions';

export interface AiSuggestionResult {
  text: string;
  error?: string;
}

export async function fetchAiSuggestion(ctx: AiSuggestionContext): Promise<AiSuggestionResult> {
  const res = await fetch('/api/ai/suggest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
