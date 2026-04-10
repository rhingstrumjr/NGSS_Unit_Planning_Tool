'use client';

import type { Unit, SummaryTableRow } from '@/lib/types';

interface PlanningTableViewProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

const COLUMNS: { field: keyof SummaryTableRow; label: string }[] = [
  { field: 'activity', label: 'Activity / Big Idea' },
  { field: 'observations', label: 'What we learned' },
  { field: 'reasoning', label: 'How it helps my understanding of my topic' },
  { field: 'connectionToPhenomenon', label: 'What do I need to modify in my model' },
];

export function PlanningTableView({ unit, updateUnit }: PlanningTableViewProps) {
  if (unit.loops.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No sensemaking loops yet.</p>
        <p className="text-sm mt-1">Add loops and learning targets to populate the planning table.</p>
      </div>
    );
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">AST Planning Table</h2>
        <p className="text-sm text-muted">
          One row per learning target. Edit cells directly — changes sync back to each target&apos;s summary table.
        </p>
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
