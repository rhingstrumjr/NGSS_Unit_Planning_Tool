'use client';

import type { UnitContext } from '@/lib/ai/worksheet-enhancer';
import { UnitContextPicker } from './UnitContextPicker';

interface WorkshopInputProps {
  text: string;
  onTextChange: (text: string) => void;
  unitContext: UnitContext | undefined;
  onUnitContextChange: (ctx: UnitContext | undefined) => void;
}

export function WorkshopInput({
  text,
  onTextChange,
  unitContext,
  onUnitContextChange,
}: WorkshopInputProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-1">Your Worksheet</h2>
      <p className="text-sm text-muted mb-3">
        Paste the text of your worksheet or lab below. The AI will enhance it while preserving your core content.
      </p>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste your worksheet text here...

Example:
Name: _______________  Date: _______________

Photosynthesis Worksheet

1. What is photosynthesis?
2. What are the reactants of photosynthesis?
3. What are the products of photosynthesis?
4. Where does photosynthesis take place?
..."
        className="w-full min-h-[200px] rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-teal/30 resize-y"
        rows={10}
      />

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted">
          {text.length > 0
            ? `${text.split(/\s+/).filter(Boolean).length} words`
            : 'No text entered'}
        </span>
      </div>

      <UnitContextPicker value={unitContext} onChange={onUnitContextChange} />
    </div>
  );
}
