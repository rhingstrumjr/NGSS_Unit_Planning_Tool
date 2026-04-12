'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import type { EnhanceWorksheetResponse } from '@/lib/ai/worksheet-enhancer';
import { STRATEGY_METADATA } from '@/lib/ai/worksheet-enhancer';

interface ResultsViewProps {
  result: EnhanceWorksheetResponse;
  onReEnhance: () => void;
}

const TABS = [
  { id: 'enhanced', label: 'Enhanced Worksheet' },
  { id: 'changelog', label: 'Change Log' },
];

export function ResultsView({ result, onReEnhance }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState('enhanced');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(result.enhancedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Group change log entries by strategy
  const changesByStrategy = result.changeLog.reduce<Record<string, typeof result.changeLog>>(
    (acc, entry) => {
      const key = entry.strategy;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {}
  );

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        trailing={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-surface-light transition-colors"
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              type="button"
              onClick={onReEnhance}
              className="text-xs px-3 py-1.5 rounded-md border border-teal text-teal hover:bg-teal/5 transition-colors"
            >
              Re-enhance
            </button>
          </div>
        }
      />

      <div className="p-5">
        {activeTab === 'enhanced' && (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-white rounded-lg border border-border p-4 max-h-[600px] overflow-y-auto">
              {result.enhancedText}
            </div>

            {result.vocabularyBank && result.vocabularyBank.length > 0 && (
              <div className="mt-4 p-4 bg-purple/5 rounded-lg border border-purple/20">
                <h3 className="text-sm font-semibold text-purple mb-2">Word Bank</h3>
                <dl className="space-y-1.5">
                  {result.vocabularyBank.map((item) => (
                    <div key={item.term} className="text-sm">
                      <dt className="font-medium text-foreground inline">{item.term}: </dt>
                      <dd className="text-muted inline">{item.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {activeTab === 'changelog' && (
          <div className="space-y-4">
            {Object.entries(changesByStrategy).map(([strategyId, entries]) => {
              const meta = STRATEGY_METADATA.find((s) => s.label === strategyId || s.id === strategyId);
              return (
                <div key={strategyId} className="border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-teal mb-2">
                    {meta?.label ?? strategyId}
                  </h3>
                  <ul className="space-y-2">
                    {entries.map((entry, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium text-foreground">{entry.section}</span>
                        <span className="text-muted"> — {entry.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {result.changeLog.length === 0 && (
              <p className="text-sm text-muted">No changes were logged.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
