'use client';

import type { Unit, Phenomenon } from '@/lib/types';
import { createBlankPhenomenon } from '@/lib/defaults';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { AddButton } from '@/components/ui/AddButton';

interface PhenomenonCardProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

export function PhenomenonCard({ unit, updateUnit }: PhenomenonCardProps) {
  function updatePhenomenon(id: string, changes: Partial<Phenomenon>) {
    updateUnit((prev) => ({
      ...prev,
      phenomena: prev.phenomena.map((p) =>
        p.id === id ? { ...p, ...changes } : p
      ),
    }));
  }

  function setPrimary(id: string) {
    updateUnit((prev) => ({
      ...prev,
      phenomena: prev.phenomena.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      })),
    }));
  }

  function addPhenomenon() {
    updateUnit((prev) => ({
      ...prev,
      phenomena: [...prev.phenomena, createBlankPhenomenon()],
    }));
  }

  function removePhenomenon(id: string) {
    updateUnit((prev) => {
      const filtered = prev.phenomena.filter((p) => p.id !== id);
      // Ensure at least one remains and is primary
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return { ...prev, phenomena: filtered };
    });
  }

  return (
    <CollapsibleCard
      title="Anchoring Phenomenon"
      subtitle={unit.phenomena.find((p) => p.isPrimary)?.name || 'Not set'}
      defaultOpen={true}
      data-section-id="phenomenon"
    >
      <div className="space-y-4">
        {unit.phenomena.map((phenom) => (
          <div
            key={phenom.id}
            className={`rounded-lg border p-4 ${
              phenom.isPrimary
                ? 'border-amber bg-amber/5'
                : 'border-border bg-surface-light/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setPrimary(phenom.id)}
                className={`text-xl ${phenom.isPrimary ? 'text-amber' : 'text-muted hover:text-amber'}`}
                title={phenom.isPrimary ? 'Primary phenomenon' : 'Set as primary'}
              >
                {phenom.isPrimary ? '\u2605' : '\u2606'}
              </button>
              <span className="text-sm text-muted">
                {phenom.isPrimary ? 'PRIMARY' : 'Alternative'}
              </span>
              {unit.phenomena.length > 1 && (
                <button
                  onClick={() => removePhenomenon(phenom.id)}
                  className="ml-auto text-sm text-muted hover:text-red"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted mb-1">Name</label>
                <input
                  type="text"
                  value={phenom.name}
                  onChange={(e) =>
                    updatePhenomenon(phenom.id, { name: e.target.value })
                  }
                  placeholder="e.g., Airbags inflate and deflate in milliseconds"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">
                  Description
                </label>
                <textarea
                  value={phenom.description}
                  onChange={(e) =>
                    updatePhenomenon(phenom.id, { description: e.target.value })
                  }
                  placeholder="Describe the phenomenon students will investigate..."
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">
                  Media URL (image/video)
                </label>
                <input
                  type="url"
                  value={phenom.mediaUrl}
                  onChange={(e) =>
                    updatePhenomenon(phenom.id, { mediaUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
                />
              </div>
            </div>
          </div>
        ))}

        <AddButton label="Add Alternative Phenomenon" onClick={addPhenomenon} />

        <div>
          <label className="block text-sm text-muted mb-1">
            Phenomenon Slides URL
          </label>
          <input
            type="url"
            value={unit.phenomenonSlidesUrl}
            onChange={(e) =>
              updateUnit((prev) => ({
                ...prev,
                phenomenonSlidesUrl: e.target.value,
              }))
            }
            placeholder="https://docs.google.com/presentation/..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
          />
        </div>
      </div>
    </CollapsibleCard>
  );
}
