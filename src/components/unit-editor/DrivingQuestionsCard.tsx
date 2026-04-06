'use client';

import type { Unit, DrivingQuestion } from '@/lib/types';
import { createBlankDrivingQuestion } from '@/lib/defaults';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { AddButton } from '@/components/ui/AddButton';

interface DrivingQuestionsCardProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

export function DrivingQuestionsCard({ unit, updateUnit }: DrivingQuestionsCardProps) {
  function updateDQ(id: string, changes: Partial<DrivingQuestion>) {
    updateUnit((prev) => ({
      ...prev,
      drivingQuestions: prev.drivingQuestions.map((dq) =>
        dq.id === id ? { ...dq, ...changes } : dq
      ),
    }));
  }

  function addDQ() {
    updateUnit((prev) => ({
      ...prev,
      drivingQuestions: [
        ...prev.drivingQuestions,
        createBlankDrivingQuestion(prev.drivingQuestions.length),
      ],
    }));
  }

  function removeDQ(id: string) {
    updateUnit((prev) => ({
      ...prev,
      drivingQuestions: prev.drivingQuestions
        .filter((dq) => dq.id !== id)
        .map((dq, i) => ({ ...dq, sortOrder: i })),
    }));
  }

  return (
    <CollapsibleCard
      title="Driving Questions"
      subtitle={`${unit.drivingQuestions.length} question${unit.drivingQuestions.length !== 1 ? 's' : ''}`}
      data-section-id="driving-questions"
    >
      <div className="space-y-4">
        {/* Unit Driving Question */}
        <div>
          <label className="block text-sm text-muted mb-1">
            Unit Driving Question
          </label>
          <input
            type="text"
            value={unit.unitDrivingQuestion}
            onChange={(e) =>
              updateUnit((prev) => ({
                ...prev,
                unitDrivingQuestion: e.target.value,
              }))
            }
            placeholder="The overarching question tied to the anchoring phenomenon..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
          />
        </div>

        {/* Predicted Sub-Questions */}
        <div>
          <label className="block text-sm text-muted mb-2">
            Predicted Student Driving Questions
          </label>
          <div className="space-y-2">
            {unit.drivingQuestions.map((dq, i) => (
              <div
                key={dq.id}
                className="flex items-start gap-2 bg-surface-light/30 rounded-lg p-3 border border-border"
              >
                <span className="text-muted text-base font-mono mt-1 w-5 text-right flex-shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={dq.text}
                    onChange={(e) => updateDQ(dq.id, { text: e.target.value })}
                    placeholder="What question might students ask?"
                    className="w-full bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      title="Click to change status"
                      onClick={() => {
                        const next: Record<DrivingQuestion['status'], DrivingQuestion['status']> = {
                          unanswered: 'in-progress',
                          'in-progress': 'answered',
                          answered: 'unanswered',
                        };
                        updateDQ(dq.id, { status: next[dq.status] });
                      }}
                      className={`text-sm px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                        dq.status === 'unanswered' ? 'bg-surface-light text-muted hover:bg-border' :
                        dq.status === 'in-progress' ? 'bg-amber/20 text-amber hover:bg-amber/30' :
                        'bg-green/20 text-green hover:bg-green/30'
                      }`}
                    >
                      {dq.status === 'unanswered' ? 'Unanswered' : dq.status === 'in-progress' ? 'In Progress' : 'Answered'}
                    </button>
                    {unit.loops.length > 0 && (
                      <select
                        value={dq.linkedLoopId || ''}
                        onChange={(e) =>
                          updateDQ(dq.id, {
                            linkedLoopId: e.target.value || null,
                          })
                        }
                        className="bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
                      >
                        <option value="">Link to loop...</option>
                        {unit.loops.map((loop, li) => (
                          <option key={loop.id} value={loop.id}>
                            Loop {li + 1}: {loop.title || 'Untitled'}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => removeDQ(dq.id)}
                      className="ml-auto text-sm text-muted hover:text-red"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <AddButton label="Add Driving Question" onClick={addDQ} />
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
