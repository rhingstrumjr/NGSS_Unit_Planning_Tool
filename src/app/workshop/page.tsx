'use client';

import { useState, useEffect, useRef } from 'react';
import type { EnhancementStrategy, UnitContext, EnhanceWorksheetResponse } from '@/lib/ai/worksheet-enhancer';
import {
  estimateEnhanceCost,
  ENHANCE_DEFAULT_MODEL,
  ENHANCE_MODEL_STORAGE_KEY,
  ENHANCE_SUPPORTED_MODELS,
} from '@/lib/ai/worksheet-enhancer';
import { WorkshopInput } from '@/components/workshop/WorkshopInput';
import { StrategyPicker } from '@/components/workshop/StrategyPicker';
import { ResultsView } from '@/components/workshop/ResultsView';

export default function WorkshopPage() {
  const [text, setText] = useState('');
  const [unitContext, setUnitContext] = useState<UnitContext | undefined>();
  const [strategies, setStrategies] = useState<EnhancementStrategy[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(ENHANCE_DEFAULT_MODEL);
  const [result, setResult] = useState<EnhanceWorksheetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Load persisted model choice on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ENHANCE_MODEL_STORAGE_KEY);
      if (stored) setSelectedModel(stored);
    } catch { /* ignore */ }
  }, []);

  function handleModelChange(model: string) {
    setSelectedModel(model);
    try { localStorage.setItem(ENHANCE_MODEL_STORAGE_KEY, model); } catch { /* ignore */ }
  }

  const canEnhance = text.trim().length > 0 && strategies.length > 0 && !loading;
  const cost = estimateEnhanceCost(selectedModel);

  async function handleEnhance() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/enhance-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: text,
          strategies,
          unitContext,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.');
        return;
      }

      setResult(data);
      // Scroll to results after a brief delay for render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReEnhance() {
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-muted hover:text-teal transition-colors">
          &larr; Back to Units
        </a>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Worksheet Enhancement Workshop</h1>
        <p className="text-muted mt-1">
          Transform existing worksheets with research-backed engagement strategies.
          Paste your worksheet, pick strategies, and get an enhanced version.
        </p>
      </div>

      <div ref={inputRef} className="space-y-5">
        <WorkshopInput
          text={text}
          onTextChange={setText}
          unitContext={unitContext}
          onUnitContextChange={setUnitContext}
        />

        <StrategyPicker
          selected={strategies}
          onChange={setStrategies}
          unitContext={unitContext}
        />

        {/* Model selector */}
        <div className="p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-foreground shrink-0">AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={loading}
                className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-teal/50 disabled:opacity-50"
              >
                {ENHANCE_SUPPORTED_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-muted">
              ~${cost.toFixed(3)} per enhancement &middot;{' '}
              <a
                href="https://ai.google.dev/gemini-api/docs/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal underline hover:no-underline"
              >
                see pricing
              </a>
            </span>
          </div>
          <p className="text-xs text-muted mt-1.5">
            Flash is fast and cost-effective. Switch to Pro for richer, more nuanced rewrites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEnhance}
            disabled={!canEnhance}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              canEnhance
                ? 'bg-teal text-white hover:bg-teal/90 shadow-sm'
                : 'bg-border text-muted cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enhancing...
              </span>
            ) : (
              'Enhance Worksheet'
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={handleEnhance}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {result && (
          <div ref={resultsRef}>
            <ResultsView result={result} onReEnhance={handleReEnhance} />
          </div>
        )}
      </div>
    </div>
  );
}
