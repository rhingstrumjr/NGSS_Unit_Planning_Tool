'use client';

import { useState, useEffect } from 'react';
import {
  GenerateUnitResponse,
  GeneratedLoop,
  SUPPORTED_MODELS,
  DEFAULT_MODEL,
  MODEL_STORAGE_KEY,
  estimateCallCost,
  MODEL_COSTS,
} from '@/lib/ai/unit-generator';

interface PhenomenonDraft {
  name: string;
  description: string;
  mediaUrl: string;
  isPrimary: boolean;
}

interface AiDraftStepProps {
  entryPoint: 'standards' | 'phenomenon' | null;
  gradeBand: string;
  standardCodes: string[];
  phenomenon: PhenomenonDraft;
  onAccept: (draft: GenerateUnitResponse) => void;
}

function getStoredModel(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function AiDraftStep({ entryPoint, gradeBand, standardCodes, phenomenon, onAccept }: AiDraftStepProps) {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [status, setStatus] = useState<'idle' | 'loading' | 'preview' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [draft, setDraft] = useState<GenerateUnitResponse | null>(null);

  // Load model from localStorage on mount
  useEffect(() => {
    setSelectedModel(getStoredModel());
  }, []);

  function handleModelChange(model: string) {
    setSelectedModel(model);
    try { localStorage.setItem(MODEL_STORAGE_KEY, model); } catch { /* ignore */ }
  }

  async function generate() {
    setStatus('loading');
    setError('');
    setDraft(null);

    try {
      const res = await fetch('/api/ai/generate-unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeBand,
          standardCodes,
          phenomenonName: phenomenon.name,
          phenomenonDescription: phenomenon.description,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Generation failed. Try again.');
        setStatus('error');
        return;
      }

      setDraft(data as GenerateUnitResponse);
      setStatus('preview');
    } catch {
      setError('Network error. Check your connection and try again.');
      setStatus('error');
    }
  }

  function handleAccept() {
    if (draft) onAccept(draft);
  }

  const hasSufficientInput =
    standardCodes.length > 0 || (phenomenon.name && phenomenon.name.trim().length > 0);

  const costEst = estimateCallCost(selectedModel);
  const costs = MODEL_COSTS[selectedModel];
  const isFreeModel = !costs; // unknown model

  // ---- Editing helpers for draft ----
  function updateDraft<K extends keyof GenerateUnitResponse>(key: K, val: GenerateUnitResponse[K]) {
    if (!draft) return;
    setDraft({ ...draft, [key]: val });
  }

  function updateSubQ(i: number, val: string) {
    if (!draft) return;
    setDraft({ ...draft, subQuestions: draft.subQuestions.map((q, idx) => (idx === i ? val : q)) });
  }
  function addSubQ() {
    if (!draft) return;
    setDraft({ ...draft, subQuestions: [...draft.subQuestions, ''] });
  }
  function removeSubQ(i: number) {
    if (!draft) return;
    const newSubs = draft.subQuestions.filter((_, idx) => idx !== i);
    // Fix loop dqIndex references
    const newLoops = draft.loops.map((l) => ({
      ...l,
      dqIndex: Math.min(l.dqIndex, Math.max(0, newSubs.length - 1)),
    }));
    setDraft({ ...draft, subQuestions: newSubs, loops: newLoops });
  }

  function updateLoop(i: number, field: keyof GeneratedLoop, val: string | number) {
    if (!draft) return;
    setDraft({ ...draft, loops: draft.loops.map((l, idx) => (idx === i ? { ...l, [field]: val } : l)) });
  }

  function updateTarget(loopIdx: number, targetIdx: number, val: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      targets: draft.targets.map((ts, li) =>
        li === loopIdx ? ts.map((t, ti) => (ti === targetIdx ? val : t)) : ts
      ),
    });
  }
  function addTarget(loopIdx: number) {
    if (!draft) return;
    setDraft({
      ...draft,
      targets: draft.targets.map((ts, li) => (li === loopIdx ? [...ts, ''] : ts)),
    });
  }
  function removeTarget(loopIdx: number, targetIdx: number) {
    if (!draft) return;
    setDraft({
      ...draft,
      targets: draft.targets.map((ts, li) =>
        li === loopIdx ? ts.filter((_, ti) => ti !== targetIdx) : ts
      ),
    });
  }

  function toggleSuggestedStandard(code: string) {
    if (!draft) return;
    const current = draft.suggestedStandardCodes;
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    setDraft({ ...draft, suggestedStandardCodes: next });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">AI Unit Draft</h1>
      <p className="text-muted mb-6">
        Let AI draft a unit plan from your{' '}
        {standardCodes.length > 0 && phenomenon.name
          ? 'standards and phenomenon'
          : standardCodes.length > 0
          ? 'selected standards'
          : 'phenomenon'}
        . Review and edit the draft, then accept to pre-fill the remaining steps.
      </p>

      {/* Model selector + cost estimate */}
      <div className="mb-6 p-4 bg-surface border border-border rounded-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-foreground shrink-0">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={status === 'loading'}
              className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-teal/50 disabled:opacity-50"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-muted">
            Est. ~${(costEst * 1000).toFixed(3)} / 1000 calls
            {!isFreeModel && (
              <>
                {' · '}
                <a
                  href="https://ai.google.dev/gemini-api/docs/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-light underline hover:text-teal"
                >
                  see pricing
                </a>
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-muted mt-2">
          Pro produces richer, more coherent output but takes longer (~5–10 s).
        </p>
      </div>

      {/* Insufficient input warning */}
      {!hasSufficientInput && (
        <div className="mb-6 p-4 bg-amber/10 border border-amber/30 rounded-xl">
          <p className="text-sm text-amber">
            Go back and select at least one standard, or enter a phenomenon name, so AI has something to work with.
          </p>
        </div>
      )}

      {/* Generate / Regenerate button */}
      {status !== 'preview' && (
        <button
          onClick={generate}
          disabled={status === 'loading' || !hasSufficientInput}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
        >
          {status === 'loading' ? (
            <>
              <span className="animate-spin text-base">⟳</span>
              Generating unit plan...
            </>
          ) : (
            <>
              <span className="text-base">✦</span>
              Generate Unit Plan with AI
            </>
          )}
        </button>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="mb-6 p-4 bg-red/10 border border-red/30 rounded-xl">
          <p className="text-sm text-red font-medium mb-2">Generation failed</p>
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={generate}
            className="mt-3 text-sm text-teal-light hover:text-teal underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Preview */}
      {status === 'preview' && draft && (
        <div className="space-y-5">
          {/* Generated phenomenon */}
          {draft.phenomenon && (
            <div className="bg-surface border border-teal/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-teal-light mb-3">Suggested Phenomenon</h3>
              <input
                type="text"
                value={draft.phenomenon.name}
                onChange={(e) => updateDraft('phenomenon', { ...draft.phenomenon!, name: e.target.value })}
                placeholder="Phenomenon name..."
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50 mb-2"
              />
              <textarea
                value={draft.phenomenon.description}
                onChange={(e) => updateDraft('phenomenon', { ...draft.phenomenon!, description: e.target.value })}
                placeholder="Phenomenon description..."
                rows={3}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50 resize-none"
              />
            </div>
          )}

          {/* Suggested standards */}
          {draft.suggestedStandardCodes.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Suggested Standards
                <span className="text-muted font-normal ml-2 text-xs">(toggle to include/exclude)</span>
              </h3>
              <div className="space-y-2">
                {draft.suggestedStandardCodes.map((code) => (
                  <label key={code} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={draft.suggestedStandardCodes.includes(code)}
                      onChange={() => toggleSuggestedStandard(code)}
                      className="rounded border-border text-teal focus:ring-teal/50"
                    />
                    <span className="text-sm text-foreground font-mono">{code}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Unit driving question */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Unit Driving Question</h3>
            <textarea
              value={draft.unitDrivingQuestion}
              onChange={(e) => updateDraft('unitDrivingQuestion', e.target.value)}
              rows={2}
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50 resize-none"
            />
          </div>

          {/* Sub-questions */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Predicted Student Sub-Questions</h3>
            <p className="text-xs text-muted mb-3">Each question drives a sensemaking loop.</p>
            <div className="space-y-2">
              {draft.subQuestions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-muted text-xs font-mono w-5 shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateSubQ(i, e.target.value)}
                    className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
                  />
                  <button
                    onClick={() => removeSubQ(i)}
                    className="text-muted hover:text-red transition-colors text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addSubQ}
              className="mt-2 flex items-center gap-1 text-xs text-teal-light hover:text-teal transition-colors"
            >
              <span className="font-bold text-sm">+</span> Add sub-question
            </button>
          </div>

          {/* Loops + targets */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Sensemaking Loops &amp; Learning Targets</h3>
            {draft.loops.map((loop, li) => (
              <div key={li} className="bg-surface border border-border rounded-xl p-5">
                {/* Loop header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {li + 1}
                  </div>
                  <input
                    type="text"
                    value={loop.title}
                    onChange={(e) => updateLoop(li, 'title', e.target.value)}
                    placeholder={`Loop ${li + 1} title...`}
                    className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={loop.durationDays}
                      onChange={(e) => updateLoop(li, 'durationDays', Number(e.target.value))}
                      className="w-16 bg-surface-light border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-teal/50 text-center"
                    />
                    <span className="text-xs text-muted">days</span>
                  </div>
                </div>

                {/* DQ link */}
                {draft.subQuestions.length > 0 && (
                  <div className="mb-3">
                    <select
                      value={loop.dqIndex}
                      onChange={(e) => updateLoop(li, 'dqIndex', Number(e.target.value))}
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-1.5 text-xs text-muted focus:outline-none focus:border-teal/50"
                    >
                      {draft.subQuestions.map((q, qi) => (
                        <option key={qi} value={qi}>
                          Sub-Q #{qi + 1}: {q.slice(0, 60)}{q.length > 60 ? '...' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Targets */}
                <div className="space-y-1.5">
                  {(draft.targets[li] || []).map((t, ti) => (
                    <div key={ti} className="flex items-center gap-2">
                      <span className="text-xs text-muted font-mono w-8 shrink-0 text-right">
                        {li + 1}.{ti + 1}
                      </span>
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => updateTarget(li, ti, e.target.value)}
                        placeholder="Students can..."
                        className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-amber/50"
                      />
                      <button
                        onClick={() => removeTarget(li, ti)}
                        className="text-muted hover:text-red transition-colors text-xs shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addTarget(li)}
                    className="mt-1 flex items-center gap-1 text-xs text-amber/80 hover:text-amber transition-colors"
                  >
                    <span className="font-bold">+</span> Add target
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Accept / Regenerate */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAccept}
              className="flex-1 px-6 py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors"
            >
              Accept &amp; Continue →
            </button>
            <button
              onClick={generate}
              className="px-5 py-3 rounded-xl border border-border text-sm text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Skip hint */}
      {status === 'idle' && (
        <div className="mt-6 p-4 bg-surface-light rounded-lg border border-border">
          <p className="text-muted text-sm">
            <span className="text-teal-light font-medium">Tip:</span> AI generation is optional — click{' '}
            <strong>Next</strong> to skip and fill in the remaining steps manually.
          </p>
        </div>
      )}
    </div>
  );
}
