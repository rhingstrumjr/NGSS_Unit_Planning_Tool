'use client';

import type { Unit, ModelStage } from '@/lib/types';
import { createModelStage } from '@/lib/defaults';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';

interface ModelProgressionCardProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

export function ModelProgressionCard({ unit, updateUnit }: ModelProgressionCardProps) {
  function updateStage(id: string, changes: Partial<ModelStage>) {
    updateUnit((prev) => ({
      ...prev,
      modelStages: prev.modelStages.map((s) =>
        s.id === id ? { ...s, ...changes } : s
      ),
    }));
  }

  // Auto-sync model stages with loop count
  function syncStages() {
    updateUnit((prev) => {
      const stages: ModelStage[] = [
        prev.modelStages.find((s) => s.label === 'Initial Model') ||
          createModelStage('Initial Model', 0),
      ];
      prev.loops.forEach((loop, i) => {
        const existing = prev.modelStages.find(
          (s) => s.label === `After Loop ${i + 1}`
        );
        stages.push(
          existing || createModelStage(`After Loop ${i + 1}`, i + 1)
        );
      });
      const complete =
        prev.modelStages.find((s) => s.label === 'Complete Model') ||
        createModelStage('Complete Model', prev.loops.length + 1);
      stages.push(complete);

      return {
        ...prev,
        modelStages: stages.map((s, i) => ({ ...s, sortOrder: i })),
      };
    });
  }

  return (
    <CollapsibleCard
      title="Model Progression"
      subtitle={`${unit.modelStages.length} stages`}
      data-section-id="model-progression"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">
            Model Template / Scaffold
          </label>
          <textarea
            value={unit.modelTemplate}
            onChange={(e) =>
              updateUnit((prev) => ({
                ...prev,
                modelTemplate: e.target.value,
              }))
            }
            placeholder="Describe the model template students will use..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
            rows={2}
          />
        </div>

        {/* Horizontal timeline */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-muted">Model Stages</label>
            <button
              onClick={syncStages}
              className="text-sm text-teal hover:text-teal-light"
            >
              Sync with loops
            </button>
          </div>

          {/* Stepper — horizontal on md+, vertical on small */}
          <div className="flex flex-col md:flex-row md:items-start gap-0 md:gap-0 overflow-x-auto pb-2">
            {unit.modelStages.map((stage, i) => {
              const isFirst = i === 0;
              const isLast = i === unit.modelStages.length - 1;
              const nodeColor = isFirst
                ? 'bg-muted border-muted text-muted'
                : isLast
                ? 'bg-green/20 border-green text-green'
                : 'bg-teal/10 border-teal text-teal';
              const dotColor = isFirst
                ? 'bg-muted'
                : isLast
                ? 'bg-green'
                : 'bg-teal';

              return (
                <div key={stage.id} className="flex md:flex-col md:flex-1 min-w-0">
                  {/* Node */}
                  <div className={`flex md:flex-col items-center md:items-center gap-2 md:gap-1 mb-2 md:mb-0`}>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor}`} />
                    {/* Horizontal connector */}
                    {!isLast && (
                      <div className="hidden md:block flex-1 h-px bg-border mx-1 mt-1.5 self-start" />
                    )}
                  </div>

                  {/* Stage card */}
                  <div
                    className={`flex-1 md:mt-2 mr-2 md:mr-3 rounded-lg border p-3 ${
                      isFirst
                        ? 'bg-surface border-border'
                        : isLast
                        ? 'bg-green/5 border-green/30'
                        : 'bg-teal/5 border-teal/20'
                    }`}
                  >
                    <span className={`block text-xs font-semibold mb-1.5 ${nodeColor.split(' ').slice(2).join(' ')}`}>
                      {stage.label}
                    </span>
                    <textarea
                      value={stage.description}
                      onChange={(e) =>
                        updateStage(stage.id, { description: e.target.value })
                      }
                      placeholder="What should the model show at this stage?"
                      className="w-full bg-transparent border-0 border-b border-border/50 text-sm focus:outline-none focus:border-teal resize-none pb-1"
                      rows={3}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arrow connectors between cards on md+ — rendered as overlay */}
          {unit.modelStages.length > 1 && (
            <div className="hidden md:flex absolute top-[52px] left-0 right-0 pointer-events-none">
              {unit.modelStages.slice(0, -1).map((stage) => (
                <div key={stage.id} className="flex-1 flex justify-end pr-1">
                  <span className="text-muted text-xs mt-0.5">→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CollapsibleCard>
  );
}
