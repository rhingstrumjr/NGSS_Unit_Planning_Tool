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

        {/* Timeline */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted">Stages</label>
            <button
              onClick={syncStages}
              className="text-sm text-teal hover:text-teal-light"
            >
              Sync with loops
            </button>
          </div>

          <div className="space-y-3">
            {unit.modelStages.map((stage, i) => (
              <div key={stage.id} className="flex items-start gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      i === 0
                        ? 'bg-muted'
                        : i === unit.modelStages.length - 1
                        ? 'bg-green'
                        : 'bg-teal'
                    }`}
                  />
                  {i < unit.modelStages.length - 1 && (
                    <div className="w-0.5 h-8 bg-border mt-1" />
                  )}
                </div>

                <div className="flex-1">
                  <span className="text-sm font-medium text-muted">
                    {stage.label}
                  </span>
                  <textarea
                    value={stage.description}
                    onChange={(e) =>
                      updateStage(stage.id, { description: e.target.value })
                    }
                    placeholder="What should the model show at this stage?"
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal resize-none mt-1"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
