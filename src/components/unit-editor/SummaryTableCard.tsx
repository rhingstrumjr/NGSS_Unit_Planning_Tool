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
    { field: 'activity', label: 'Activity — What did we do?', placeholder: 'Describe the investigation or activity...', fieldType: 'summary-table-activity' },
    { field: 'observations', label: 'Observations — What happened?', placeholder: 'Patterns or observations students noticed...', fieldType: 'summary-table-observations' },
    { field: 'reasoning', label: 'Reasoning — Why did it happen?', placeholder: 'What students think caused the patterns...', fieldType: 'summary-table-reasoning' },
    { field: 'connectionToPhenomenon', label: 'Connection to Phenomenon', placeholder: 'How does this help explain the phenomenon?', fieldType: 'summary-table-connection' },
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
