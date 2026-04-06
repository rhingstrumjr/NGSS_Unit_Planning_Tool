'use client';

import { useState, useRef, useEffect } from 'react';
import { fetchAiSuggestion } from '@/lib/ai/client';
import type { AiSuggestionContext } from '@/lib/ai/suggestions';

interface AiSuggestButtonProps {
  context: AiSuggestionContext;
  onAccept: (text: string) => void;
  /** If true, appends suggestions as a list (e.g. sub-questions). Default: false (replaces) */
  appendMode?: boolean;
}

const API_KEY_STORAGE = 'ngss-gemini-key';

function getStoredKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(API_KEY_STORAGE) ?? '';
}

export function AiSuggestButton({ context, onAccept, appendMode = false }: AiSuggestButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  async function generate() {
    const key = getStoredKey();
    if (!key) {
      setNeedsKey(true);
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    setSuggestion('');
    setError('');
    const result = await fetchAiSuggestion(context);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuggestion(result.text);
    }
  }

  function handleAccept() {
    if (suggestion) {
      onAccept(suggestion);
      setOpen(false);
      setSuggestion('');
    }
  }

  function handleSaveKey() {
    if (keyInput.trim()) {
      localStorage.setItem(API_KEY_STORAGE, keyInput.trim());
      setNeedsKey(false);
      setKeyInput('');
      generate();
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={generate}
        title="Get AI suggestion"
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-muted hover:text-teal-light hover:bg-teal/10 transition-colors border border-transparent hover:border-teal/20"
      >
        <span>✨</span>
        <span>AI</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 right-0 top-full mt-1 w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden"
        >
          {needsKey ? (
            <div className="p-4">
              <p className="text-base font-semibold text-foreground mb-1">Enter Google AI API Key</p>
              <p className="text-sm text-muted mb-3">
                Your key is stored locally and never sent to our servers.
              </p>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                placeholder="AIza..."
                autoFocus
                className="w-full bg-surface-light border border-border rounded-lg px-4 py-2.5 text-base text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveKey}
                  disabled={!keyInput.trim()}
                  className="flex-1 py-1.5 bg-teal hover:bg-teal-light text-white text-base font-medium rounded-lg transition-colors disabled:opacity-40"
                >
                  Save & Generate
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 bg-surface-light hover:bg-border text-muted text-base rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="p-4 text-center">
              <div className="inline-block w-5 h-5 border-2 border-teal/30 border-t-teal rounded-full animate-spin mb-2" />
              <p className="text-sm text-muted">Generating suggestion...</p>
            </div>
          ) : error ? (
            <div className="p-4">
              <p className="text-sm text-red mb-3">{error}</p>
              <div className="flex gap-2">
                <button onClick={generate} className="flex-1 py-1.5 bg-surface-light hover:bg-border text-base text-muted rounded-lg transition-colors">
                  Try again
                </button>
                <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-base text-muted hover:text-foreground transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          ) : suggestion ? (
            <div className="p-4">
              <p className="text-sm text-muted mb-2 font-medium">Suggestion:</p>
              <p className="text-base text-foreground leading-relaxed mb-4 whitespace-pre-wrap">{suggestion}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 py-1.5 bg-teal hover:bg-teal-light text-white text-base font-medium rounded-lg transition-colors"
                >
                  {appendMode ? 'Add this' : 'Use this'}
                </button>
                <button onClick={generate} className="px-3 py-1.5 bg-surface-light hover:bg-border text-base text-muted rounded-lg transition-colors">
                  ↻
                </button>
                <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-base text-muted hover:text-foreground transition-colors">
                  ✕
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Gets the stored API key. Returns empty string if none. */
export function getApiKey(): string {
  return getStoredKey();
}

/** Clears the stored API key. */
export function clearApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}
