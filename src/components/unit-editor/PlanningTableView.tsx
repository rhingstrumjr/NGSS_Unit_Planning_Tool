'use client';

import { useState } from 'react';
import type { Unit, SummaryTableRow } from '@/lib/types';
import { fetchAiSuggestion } from '@/lib/ai/client';
import type { AiFieldType } from '@/lib/ai/suggestions';

interface PlanningTableViewProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

const COLUMNS: { field: keyof SummaryTableRow; label: string; fieldType: AiFieldType }[] = [
  { field: 'activity',               label: 'Activity / Big Idea',                          fieldType: 'summary-table-activity' },
  { field: 'observations',           label: 'What we learned',                               fieldType: 'summary-table-observations' },
  { field: 'reasoning',              label: 'How it helps my understanding of my topic',     fieldType: 'summary-table-reasoning' },
  { field: 'connectionToPhenomenon', label: 'What do I need to modify in my model',         fieldType: 'summary-table-connection' },
];

export function PlanningTableView({ unit, updateUnit }: PlanningTableViewProps) {
  const [filling, setFilling] = useState(false);
  const [progress, setProgress] = useState('');

  const primaryPhenomenon = unit.phenomena.find((p) => p.isPrimary) ?? unit.phenomena[0];

  /** Build a readable summary of a target's activities for AI context */
  function buildActivitiesText(target: Unit['loops'][number]['targets'][number]): string {
    return target.activities
      .map((a) =>
        [
          a.title,
          a.description && `  Description: ${a.description}`,
          a.keyQuestions && `  Key questions: ${a.keyQuestions}`,
        ]
          .filter(Boolean)
          .join('\n')
      )
      .join('\n\n');
  }

  // Count cells that would be touched (empty only)
  const emptyCellCount = unit.loops.reduce((total, loop) =>
    total + loop.targets.reduce((t2, target) =>
      t2 + COLUMNS.filter((col) => !target.summaryTable[col.field]?.trim()).length, 0), 0);

  async function autoFillEmpty() {
    if (filling) return;
    setFilling(true);

    let filled = 0;
    for (const loop of unit.loops) {
      for (const target of loop.targets) {
        // Collect all updates for this target so we apply them in one updateUnit call
        const updates: Partial<SummaryTableRow> = {};

        for (const col of COLUMNS) {
          if (target.summaryTable[col.field]?.trim()) continue; // skip non-empty

          filled++;
          setProgress(`Filling ${filled} of ${emptyCellCount}…`);

          // --- Column 1: derive directly from activity titles ---
          if (col.field === 'activity') {
            const titles = target.activities.map((a) => a.title).filter(Boolean);
            updates.activity = titles.length > 0 ? titles.join('\n') : target.title;
            continue;
          }

          // --- Column 4: copy from modelContribution ---
          if (col.field === 'connectionToPhenomenon') {
            if (target.modelContribution?.trim()) {
              updates.connectionToPhenomenon = target.modelContribution;
            }
            // If modelContribution is also empty, skip — no data to derive from
            continue;
          }

          // --- Columns 2 & 3: AI with full activity context ---
          const result = await fetchAiSuggestion({
            fieldType: col.fieldType,
            phenomenonName: primaryPhenomenon?.name,
            phenomenonDescription: primaryPhenomenon?.description,
            unitDrivingQuestion: unit.unitDrivingQuestion,
            loopTitle: loop.title,
            loopIndex: unit.loops.indexOf(loop),
            targetTitle: target.title,
            dciAlignment: target.dciAlignment,
            sepAlignment: target.sepAlignment,
            cccAlignment: target.cccAlignment,
            activitiesText: buildActivitiesText(target),
          });

          if (result.text && !result.error) {
            (updates as Record<string, string>)[col.field] = result.text;
          }
        }

        // Apply all updates for this target at once
        if (Object.keys(updates).length > 0) {
          const loopId = loop.id;
          const targetId = target.id;
          updateUnit((prev) => ({
            ...prev,
            loops: prev.loops.map((l) =>
              l.id !== loopId ? l : {
                ...l,
                targets: l.targets.map((t) =>
                  t.id !== targetId ? t : {
                    ...t,
                    summaryTable: { ...t.summaryTable, ...updates },
                  }
                ),
              }
            ),
          }));
        }
      }
    }

    setFilling(false);
    setProgress('');
  }

  function updateSummaryField(loopId: string, targetId: string, field: keyof SummaryTableRow, value: string) {
    updateUnit((prev) => ({
      ...prev,
      loops: prev.loops.map((loop) =>
        loop.id !== loopId
          ? loop
          : {
              ...loop,
              targets: loop.targets.map((t) =>
                t.id !== targetId
                  ? t
                  : { ...t, summaryTable: { ...t.summaryTable, [field]: value } }
              ),
            }
      ),
    }));
  }

  if (unit.loops.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No sensemaking loops yet.</p>
        <p className="text-sm mt-1">Add loops and learning targets to populate the planning table.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1">AST Planning Table</h2>
          <p className="text-sm text-muted">
            One row per learning target. Edit cells directly — changes sync back to each target&apos;s summary table.
          </p>
        </div>

        {emptyCellCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {filling && progress && (
              <span className="text-sm text-muted">{progress}</span>
            )}
            <button
              onClick={autoFillEmpty}
              disabled={filling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-teal/30 text-teal-light hover:bg-teal/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {filling ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                  Filling…
                </>
              ) : (
                <>✨ Fill from unit data ({emptyCellCount} empty {emptyCellCount === 1 ? 'cell' : 'cells'})</>
              )}
            </button>
          </div>
        )}
      </div>

      {unit.loops.map((loop, loopIndex) => {
        const dq =
          loop.dqRef != null
            ? unit.drivingQuestions[loop.dqRef] ?? null
            : null;

        return (
          <div key={loop.id} className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* Loop header */}
            <div className="bg-teal/10 border-b border-border px-5 py-3">
              <h3 className="font-semibold text-base">
                Loop {loopIndex + 1}{loop.title ? `: ${loop.title}` : ''}
              </h3>
              {dq && (
                <p className="text-sm text-muted mt-0.5">
                  <span className="font-medium text-foreground">Driving Question:</span> {dq.text}
                </p>
              )}
            </div>

            {loop.targets.length === 0 ? (
              <div className="px-5 py-4 text-sm text-muted">
                No learning targets in this loop yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="text-left px-3 py-2 font-medium text-muted w-8 whitespace-nowrap">#</th>
                      {COLUMNS.map((col) => (
                        <th key={col.field} className="text-left px-3 py-2 font-medium text-muted">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loop.targets.map((target, targetIndex) => (
                      <tr key={target.id} className="border-b border-border/50 last:border-b-0 align-top">
                        <td className="px-3 py-2 text-muted whitespace-nowrap">
                          {loopIndex + 1}.{targetIndex + 1}
                          {target.title && (
                            <div className="text-xs text-muted/70 mt-0.5 max-w-[6rem] truncate" title={target.title}>
                              {target.title}
                            </div>
                          )}
                        </td>
                        {COLUMNS.map((col) => (
                          <td key={col.field} className="px-2 py-1.5">
                            <textarea
                              value={target.summaryTable[col.field]}
                              onChange={(e) =>
                                updateSummaryField(loop.id, target.id, col.field, e.target.value)
                              }
                              placeholder="—"
                              className="w-full min-w-[160px] bg-transparent border border-transparent hover:border-border focus:border-teal rounded px-2 py-1.5 text-sm focus:outline-none resize-none transition-colors"
                              rows={3}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
