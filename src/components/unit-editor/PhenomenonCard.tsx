'use client';

import { useState } from 'react';
import type { Unit, Phenomenon } from '@/lib/types';
import { createBlankPhenomenon } from '@/lib/defaults';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { AddButton } from '@/components/ui/AddButton';

interface PhenomenonCardProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

interface EvalCriterion {
  name: string;
  score: number;
  feedback: string;
}

interface EvalResult {
  criteria: EvalCriterion[];
  summary: string;
}

type EvalStatus = 'idle' | 'loading' | 'done' | 'error';

interface EvalState {
  status: EvalStatus;
  result?: EvalResult;
  error?: string;
}

const SCORE_STYLES: Record<number, { bg: string; text: string; border: string; label: string }> = {
  0: { bg: 'bg-red/10',   text: 'text-red',   border: 'border-red/30',   label: 'Not met' },
  1: { bg: 'bg-amber/10', text: 'text-amber', border: 'border-amber/30', label: 'Partially met' },
  2: { bg: 'bg-teal/10',  text: 'text-teal',  border: 'border-teal/30',  label: 'Mostly met' },
  3: { bg: 'bg-green/10', text: 'text-green', border: 'border-green/30', label: 'Fully met' },
};

export function PhenomenonCard({ unit, updateUnit }: PhenomenonCardProps) {
  const [evalStates, setEvalStates] = useState<Record<string, EvalState>>({});

  function updatePhenomenon(id: string, changes: Partial<Phenomenon>) {
    updateUnit((prev) => ({
      ...prev,
      phenomena: prev.phenomena.map((p) =>
        p.id === id ? { ...p, ...changes } : p
      ),
    }));
  }

  function setPrimary(id: string) {
    updateUnit((prev) => ({
      ...prev,
      phenomena: prev.phenomena.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      })),
    }));
  }

  function addPhenomenon() {
    updateUnit((prev) => ({
      ...prev,
      phenomena: [...prev.phenomena, createBlankPhenomenon()],
    }));
  }

  function removePhenomenon(id: string) {
    updateUnit((prev) => {
      const filtered = prev.phenomena.filter((p) => p.id !== id);
      // Ensure at least one remains and is primary
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return { ...prev, phenomena: filtered };
    });
  }

  async function evaluatePhenomenon(phenom: Phenomenon) {
    setEvalStates((prev) => ({ ...prev, [phenom.id]: { status: 'loading' } }));
    try {
      const res = await fetch('/api/ai/evaluate-phenomenon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phenomenonName: phenom.name,
          phenomenonDescription: phenom.description,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEvalStates((prev) => ({
          ...prev,
          [phenom.id]: { status: 'error', error: data.error ?? 'Unknown error' },
        }));
      } else {
        setEvalStates((prev) => ({
          ...prev,
          [phenom.id]: { status: 'done', result: data },
        }));
      }
    } catch (err) {
      setEvalStates((prev) => ({
        ...prev,
        [phenom.id]: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      }));
    }
  }

  return (
    <CollapsibleCard
      title="Anchoring Phenomenon"
      subtitle={unit.phenomena.find((p) => p.isPrimary)?.name || 'Not set'}
      defaultOpen={true}
      data-section-id="phenomenon"
    >
      <div className="space-y-4">
        {unit.phenomena.map((phenom) => {
          const ev = evalStates[phenom.id] ?? { status: 'idle' };

          return (
            <div
              key={phenom.id}
              className={`rounded-lg border p-4 ${
                phenom.isPrimary
                  ? 'border-amber bg-amber/5'
                  : 'border-border bg-surface-light/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setPrimary(phenom.id)}
                  className={`text-xl ${phenom.isPrimary ? 'text-amber' : 'text-muted hover:text-amber'}`}
                  title={phenom.isPrimary ? 'Primary phenomenon' : 'Set as primary'}
                >
                  {phenom.isPrimary ? '\u2605' : '\u2606'}
                </button>
                <span className="text-sm text-muted">
                  {phenom.isPrimary ? 'PRIMARY' : 'Alternative'}
                </span>
                {unit.phenomena.length > 1 && (
                  <button
                    onClick={() => removePhenomenon(phenom.id)}
                    className="ml-auto text-sm text-muted hover:text-red"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-muted mb-1">Name</label>
                  <input
                    type="text"
                    value={phenom.name}
                    onChange={(e) =>
                      updatePhenomenon(phenom.id, { name: e.target.value })
                    }
                    placeholder="e.g., Airbags inflate and deflate in milliseconds"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted mb-1">Description</label>
                  <textarea
                    value={phenom.description}
                    onChange={(e) =>
                      updatePhenomenon(phenom.id, { description: e.target.value })
                    }
                    placeholder="Describe the phenomenon students will investigate..."
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
                    rows={3}
                  />
                </div>

                {/* Evaluate button */}
                <div>
                  <button
                    onClick={() => evaluatePhenomenon(phenom)}
                    disabled={!phenom.name.trim() || ev.status === 'loading'}
                    className="flex items-center gap-1.5 text-sm text-teal hover:text-teal-light disabled:text-muted disabled:cursor-not-allowed transition-colors"
                  >
                    {ev.status === 'loading' ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Evaluating…
                      </>
                    ) : (
                      <>✨ {ev.status === 'done' ? 'Re-evaluate' : 'Evaluate Phenomenon'}</>
                    )}
                  </button>
                </div>

                {/* Error state */}
                {ev.status === 'error' && (
                  <div className="text-sm text-red bg-red/5 border border-red/20 rounded-lg px-3 py-2">
                    {ev.error}
                  </div>
                )}

                {/* Results panel */}
                {ev.status === 'done' && ev.result && (
                  <div className="rounded-lg border border-border bg-surface overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-light/50 border-b border-border">
                      <span className="text-sm font-medium">✨ AI Quality Evaluation</span>
                      <span className="flex items-center gap-1 text-xs bg-amber/10 text-amber border border-amber/30 rounded px-2 py-0.5 whitespace-nowrap">
                        ⚠️ AI-graded — use your best judgement
                      </span>
                    </div>

                    {/* Criteria rows */}
                    <div className="divide-y divide-border">
                      {ev.result.criteria.map((c) => {
                        const style = SCORE_STYLES[c.score] ?? SCORE_STYLES[0];
                        return (
                          <div key={c.name} className="px-3 py-2.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border min-w-[1.5rem] text-center ${style.bg} ${style.text} ${style.border}`}>
                                {c.score}/3
                              </span>
                              <span className="text-sm font-medium">{c.name}</span>
                              <span className={`text-xs ml-auto ${style.text}`}>{style.label}</span>
                            </div>
                            <p className="text-xs text-muted pl-10">{c.feedback}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary */}
                    <div className="px-3 py-2.5 bg-surface-light/30 border-t border-border">
                      <p className="text-xs text-muted italic">{ev.result.summary}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-muted mb-1">
                    Media URL (image/video)
                  </label>
                  <input
                    type="url"
                    value={phenom.mediaUrl}
                    onChange={(e) =>
                      updatePhenomenon(phenom.id, { mediaUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <AddButton label="Add Alternative Phenomenon" onClick={addPhenomenon} />

        <div>
          <label className="block text-sm text-muted mb-1">
            Phenomenon Slides URL
          </label>
          <input
            type="url"
            value={unit.phenomenonSlidesUrl}
            onChange={(e) =>
              updateUnit((prev) => ({
                ...prev,
                phenomenonSlidesUrl: e.target.value,
              }))
            }
            placeholder="https://docs.google.com/presentation/..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
          />
        </div>
      </div>
    </CollapsibleCard>
  );
}
