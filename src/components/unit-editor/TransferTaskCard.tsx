'use client';

import type { Unit, TransferTask } from '@/lib/types';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { GottaHaveList } from './GottaHaveList';

interface TransferTaskCardProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

export function TransferTaskCard({ unit, updateUnit }: TransferTaskCardProps) {
  function updateTransfer(changes: Partial<TransferTask>) {
    updateUnit((prev) => ({
      ...prev,
      transferTask: { ...prev.transferTask, ...changes },
    }));
  }

  return (
    <CollapsibleCard
      title="Transfer Task"
      subtitle={unit.transferTask.title || 'Not set'}
      borderColor="border-l-amber"
      data-section-id="transfer-task"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">Title</label>
          <input
            type="text"
            value={unit.transferTask.title}
            onChange={(e) => updateTransfer({ title: e.target.value })}
            placeholder="e.g., Airbag Design Challenge"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">
            Task Description
          </label>
          <textarea
            value={unit.transferTask.taskDescription}
            onChange={(e) =>
              updateTransfer({ taskDescription: e.target.value })
            }
            placeholder="Describe the summative transfer task..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-muted mb-1">
              Assessment URL
            </label>
            <input
              type="url"
              value={unit.transferTask.assessmentUrl}
              onChange={(e) =>
                updateTransfer({ assessmentUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">
              Rubric URL
            </label>
            <input
              type="url"
              value={unit.transferTask.rubricUrl}
              onChange={(e) => updateTransfer({ rubricUrl: e.target.value })}
              placeholder="https://..."
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">
              Slides URL
            </label>
            <input
              type="url"
              value={unit.transferTask.slidesUrl}
              onChange={(e) => updateTransfer({ slidesUrl: e.target.value })}
              placeholder="https://..."
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        <GottaHaveList
          items={unit.transferTask.gottaHaveItems}
          onChange={(gottaHaveItems) => updateTransfer({ gottaHaveItems })}
        />
      </div>
    </CollapsibleCard>
  );
}
