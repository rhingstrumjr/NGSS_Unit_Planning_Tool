'use client';

import { useState } from 'react';
import { NGSS_STANDARDS } from '@/lib/ngss-standards';

interface StandardsStepProps {
  gradeBand: string;
  selectedCodes: string[];
  onGradeBandChange: (v: string) => void;
  onToggle: (code: string) => void;
}

const DOMAIN_LABELS: Record<string, string> = {
  PS: 'Physical Science',
  LS: 'Life Science',
  ESS: 'Earth & Space Science',
  ETS: 'Engineering',
};

export function StandardsStep({ gradeBand, selectedCodes, onGradeBandChange, onToggle }: StandardsStepProps) {
  const [query, setQuery] = useState('');

  const filtered = NGSS_STANDARDS.filter((s) => {
    const matchBand = !gradeBand || s.gradeBand === gradeBand;
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      s.code.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.dci.toLowerCase().includes(q);
    return matchBand && matchQuery;
  });

  const grouped = filtered.reduce<Record<string, typeof NGSS_STANDARDS>>((acc, s) => {
    const key = s.domain;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Select Standards</h1>
      <p className="text-muted mb-6">
        Choose the Performance Expectations your unit will address. You can add or remove these later.
      </p>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex gap-2">
          {['', 'HS', 'MS'].map((band) => (
            <button
              key={band}
              onClick={() => onGradeBandChange(band)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                gradeBand === band
                  ? 'bg-teal text-white'
                  : 'bg-surface-light text-muted hover:text-foreground'
              }`}
            >
              {band || 'All'}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or keyword..."
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
        />
      </div>

      {/* Selected summary */}
      {selectedCodes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedCodes.map((code) => (
            <span
              key={code}
              className="flex items-center gap-1 px-2 py-1 bg-teal/20 text-teal-light rounded text-xs font-medium"
            >
              {code}
              <button onClick={() => onToggle(code)} className="hover:text-white ml-0.5">✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Standard list grouped by domain */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([domain, standards]) => (
          <div key={domain}>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              {DOMAIN_LABELS[domain] ?? domain}
            </h3>
            <div className="space-y-1">
              {standards.map((s) => {
                const selected = selectedCodes.includes(s.code);
                return (
                  <button
                    key={s.code}
                    onClick={() => onToggle(s.code)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selected
                        ? 'border-teal/50 bg-teal/10'
                        : 'border-border bg-surface hover:border-teal/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs ${
                        selected ? 'bg-teal border-teal text-white' : 'border-muted'
                      }`}>
                        {selected && '✓'}
                      </span>
                      <div>
                        <span className="text-teal-light font-mono text-xs font-semibold mr-2">{s.code}</span>
                        <span className="text-sm text-foreground">{s.title}</span>
                        <div className="flex gap-3 mt-1 text-xs text-muted">
                          <span>DCI: {s.dci}</span>
                          <span>SEP: {s.sep}</span>
                          <span>CCC: {s.ccc}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted text-sm text-center py-8">No standards match your search.</p>
        )}
      </div>
    </div>
  );
}
