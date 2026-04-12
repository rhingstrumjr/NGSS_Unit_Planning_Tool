'use client';

import type { EnhancementStrategy, UnitContext } from '@/lib/ai/worksheet-enhancer';
import { STRATEGY_METADATA } from '@/lib/ai/worksheet-enhancer';

const MAX_STRATEGIES = 5;

const RECOMMENDED: EnhancementStrategy[] = [
  'upgrade-cognitive-level',
  'cer-scaffolding',
  'metacognitive-reflection',
];

interface StrategyPickerProps {
  selected: EnhancementStrategy[];
  onChange: (strategies: EnhancementStrategy[]) => void;
  unitContext: UnitContext | undefined;
}

export function StrategyPicker({ selected, onChange, unitContext }: StrategyPickerProps) {
  function toggle(id: EnhancementStrategy) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < MAX_STRATEGIES) {
      onChange([...selected, id]);
    }
  }

  function selectRecommended() {
    onChange(RECOMMENDED);
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-foreground">Enhancement Strategies</h2>
        <span className="text-sm text-muted">
          {selected.length} of {MAX_STRATEGIES} selected
        </span>
      </div>
      <p className="text-sm text-muted mb-3">
        Choose which research-backed strategies to apply.{' '}
        <button
          type="button"
          onClick={selectRecommended}
          className="text-teal hover:underline"
        >
          Select recommended
        </button>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {STRATEGY_METADATA.map((strategy) => {
          const isSelected = selected.includes(strategy.id);
          const isDisabled = !isSelected && selected.length >= MAX_STRATEGIES;

          return (
            <button
              key={strategy.id}
              type="button"
              onClick={() => !isDisabled && toggle(strategy.id)}
              disabled={isDisabled}
              className={`text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-teal bg-teal/5 ring-1 ring-teal/20'
                  : isDisabled
                    ? 'border-border bg-surface opacity-40 cursor-not-allowed'
                    : 'border-border bg-white hover:border-teal/40 hover:bg-teal/5 cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-teal bg-teal' : 'border-border'
                  }`}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{strategy.label}</span>
                    {strategy.bestWithContext && !unitContext && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20">
                        best with unit context
                      </span>
                    )}
                    {strategy.bestWithContext && unitContext && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
                        context linked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{strategy.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
