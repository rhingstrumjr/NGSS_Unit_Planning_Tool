'use client';

import type { FormativeAssessment, FormativeFormat } from '@/lib/types';
import { createBlankFormative } from '@/lib/defaults';
import { AiSuggestButton } from '@/components/ui/AiSuggestButton';

interface AiContext {
  phenomenonName?: string;
  loopTitle?: string;
  loopIndex?: number;
  targetTitle?: string;
  dciAlignment?: string;
  sepAlignment?: string;
  cccAlignment?: string;
}

interface FormativeCardProps {
  formative: FormativeAssessment | null;
  onChange: (formative: FormativeAssessment | null) => void;
  aiContext?: AiContext;
}

const formats: FormativeFormat[] = [
  'Exit Ticket',
  'CER',
  'Warm-Up',
  'Whiteboard Check',
  'Discussion',
  'Mini Quiz',
  'Observation',
  'Other',
];

export function FormativeCard({ formative, onChange, aiContext }: FormativeCardProps) {
  if (!formative) {
    return (
      <div>
        <label className="block text-sm text-muted mb-1">
          Formative Assessment
        </label>
        <button
          onClick={() => onChange(createBlankFormative())}
          className="text-sm text-teal hover:text-teal-light flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Formative Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-purple-light/10 border border-purple/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-purple-light">
          Formative Assessment
        </label>
        <button
          onClick={() => onChange(null)}
          className="text-sm text-muted hover:text-red"
        >
          Remove
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={formative.format}
            onChange={(e) =>
              onChange({ ...formative, format: e.target.value as FormativeFormat })
            }
            className="bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
          >
            {formats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {aiContext && (
            <AiSuggestButton
              context={{ fieldType: 'formative', ...aiContext }}
              onAccept={(text) => onChange({ ...formative, text })}
            />
          )}
        </div>
        <textarea
          value={formative.text}
          onChange={(e) => onChange({ ...formative, text: e.target.value })}
          placeholder="Assessment prompt or description..."
          className="w-full bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal resize-none"
          rows={2}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={formative.resourceTitle}
            onChange={(e) =>
              onChange({ ...formative, resourceTitle: e.target.value })
            }
            placeholder="Resource title (optional)"
            className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
          />
          <input
            type="url"
            value={formative.resourceUrl}
            onChange={(e) =>
              onChange({ ...formative, resourceUrl: e.target.value })
            }
            placeholder="URL (optional)"
            className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
          />
        </div>
      </div>
    </div>
  );
}
