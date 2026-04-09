'use client';

import type { SummaryTableRow } from '@/lib/types';
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

interface SummaryTableCardProps {
  summaryTable: SummaryTableRow;
  onChange: (table: SummaryTableRow) => void;
  aiContext?: AiContext;
}

export function SummaryTableCard({ summaryTable, onChange, aiContext }: SummaryTableCardProps) {
  function update(field: keyof SummaryTableRow, value: string) {
    onChange({ ...summaryTable, [field]: value });
  }

  const cells: { field: keyof SummaryTableRow; label: string; placeholder: string; fieldType: 'summary-table-activity' | 'summary-table-observations' | 'summary-table-reasoning' | 'summary-table-connection' }[] = [
    { field: 'activity', label: 'Activity / Big Idea', placeholder: 'Describe the big idea or investigation...', fieldType: 'summary-table-activity' },
    { field: 'observations', label: 'What we learned', placeholder: 'What students learned from this activity...', fieldType: 'summary-table-observations' },
    { field: 'reasoning', label: 'How it helps my understanding of my topic', placeholder: 'How this connects to the bigger picture...', fieldType: 'summary-table-reasoning' },
    { field: 'connectionToPhenomenon', label: 'What do I need to modify in my model', placeholder: 'What to add or change in the class model...', fieldType: 'summary-table-connection' },
  ];

  return (
    <div className="bg-purple/10 border border-purple/20 rounded-lg p-3">
      <label className="block text-sm font-medium text-purple mb-2">
        Summary Table — Ambitious Science Teaching
      </label>
      <div className="grid grid-cols-2 gap-2">
        {cells.map(({ field, label, placeholder, fieldType }) => (
          <div key={field}>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-sm text-muted">{label}</label>
              {aiContext && (
                <AiSuggestButton
                  context={{ fieldType, ...aiContext }}
                  onAccept={(text) => update(field, text)}
                />
              )}
            </div>
            <textarea
              value={summaryTable[field]}
              onChange={(e) => update(field, e.target.value)}
              placeholder={placeholder}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal resize-none"
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
