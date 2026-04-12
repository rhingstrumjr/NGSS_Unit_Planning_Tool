'use client';

import { v4 as uuid } from 'uuid';
import type { Activity, ActivityType, Resource } from '@/lib/types';
import { createBlankActivity } from '@/lib/defaults';
import { AddButton } from '@/components/ui/AddButton';
import { AiSuggestButton } from '@/components/ui/AiSuggestButton';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AiContext {
  phenomenonName?: string;
  loopTitle?: string;
  loopIndex?: number;
  targetTitle?: string;
  dciAlignment?: string;
  sepAlignment?: string;
  cccAlignment?: string;
}

interface ActivityListProps {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
  aiContext?: AiContext;
  unitId?: string;
  loopId?: string;
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'lab', label: 'Lab' },
  { value: 'reading', label: 'Reading' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'modeling', label: 'Modeling' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
];

export function ActivityList({ activities, onChange, aiContext, unitId, loopId }: ActivityListProps) {
  function update(id: string, changes: Partial<Activity>) {
    onChange(activities.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }

  function add() {
    onChange([...activities, createBlankActivity(activities.length)]);
  }

  function remove(id: string) {
    onChange(
      activities
        .filter((a) => a.id !== id)
        .map((a, i) => ({ ...a, sortOrder: i }))
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activities.findIndex((a) => a.id === active.id);
    const newIndex = activities.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(
      arrayMove(activities, oldIndex, newIndex).map((a, i) => ({
        ...a,
        sortOrder: i,
      }))
    );
  }

  return (
    <div>
      <label className="block text-sm text-muted mb-1">Activities</label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activities.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
      <div className="space-y-2">
        {activities.map((act) => (
          <SortableActivityItem key={act.id} id={act.id}>
          <div
            className="bg-surface-light/20 rounded-lg p-3 border border-border space-y-2"
          >
            <div className="flex items-center gap-2">
              <select
                value={act.type}
                onChange={(e) =>
                  update(act.id, { type: e.target.value as ActivityType })
                }
                className="bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
              >
                {activityTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={act.title}
                onChange={(e) => update(act.id, { title: e.target.value })}
                placeholder="Activity title"
                className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
              />
              <input
                type="number"
                value={act.durationMinutes || ''}
                onChange={(e) =>
                  update(act.id, {
                    durationMinutes: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="min"
                className="w-16 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
              />
              <span className="text-sm text-muted">min</span>
              <button
                onClick={() => remove(act.id)}
                className="text-muted hover:text-red text-sm"
              >
                x
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-sm text-muted">Description</label>
                {aiContext && (
                  <AiSuggestButton
                    context={{ fieldType: 'activity-description', ...aiContext }}
                    onAccept={(text) => update(act.id, { description: text })}
                  />
                )}
              </div>
              <textarea
                value={act.description}
                onChange={(e) =>
                  update(act.id, { description: e.target.value })
                }
                placeholder="Description / teacher instructions..."
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal resize-none"
                rows={2}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-sm text-muted">Key Questions</label>
                {aiContext && (
                  <AiSuggestButton
                    context={{ fieldType: 'key-questions', ...aiContext }}
                    onAccept={(text) => update(act.id, { keyQuestions: text })}
                  />
                )}
              </div>
              <textarea
                value={act.keyQuestions}
                onChange={(e) =>
                  update(act.id, { keyQuestions: e.target.value })
                }
                placeholder="Key questions / back-pocket questions for discourse..."
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal resize-none"
                rows={2}
              />
            </div>
            {/* AI Workshop link */}
            {(unitId || loopId) && (
              <div>
                <a
                  href={`/workshop?${unitId ? `unitId=${unitId}` : ''}${unitId && loopId ? '&' : ''}${loopId ? `loopId=${loopId}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal hover:underline flex items-center gap-1"
                >
                  ✨ Enhance a worksheet for this activity
                </a>
              </div>
            )}

            {/* Activity Files / Links */}
            <div>
              <label className="text-sm text-muted block mb-1">
                Files &amp; Links
                <span className="ml-1 text-muted/60">(student doc, answer key, video, absent version…)</span>
              </label>
              <div className="space-y-1">
                {(act.resources ?? []).map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={r.title}
                      onChange={(e) =>
                        update(act.id, {
                          resources: (act.resources ?? []).map((x) =>
                            x.id === r.id ? { ...x, title: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="Label (e.g. Student Doc)"
                      className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
                    />
                    <input
                      type="url"
                      value={r.url}
                      onChange={(e) =>
                        update(act.id, {
                          resources: (act.resources ?? []).map((x) =>
                            x.id === r.id ? { ...x, url: e.target.value } : x
                          ),
                        })
                      }
                      placeholder="URL"
                      className="flex-[2] bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
                    />
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal text-sm flex-shrink-0"
                      >
                        ↗
                      </a>
                    )}
                    <button
                      onClick={() =>
                        update(act.id, {
                          resources: (act.resources ?? [])
                            .filter((x) => x.id !== r.id)
                            .map((x, i) => ({ ...x, sortOrder: i })),
                        })
                      }
                      className="text-muted hover:text-red text-sm flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  update(act.id, {
                    resources: [
                      ...(act.resources ?? []),
                      { id: uuid(), sortOrder: (act.resources ?? []).length, title: '', url: '', type: 'link' as Resource['type'] },
                    ],
                  })
                }
                className="mt-1 text-sm text-muted hover:text-teal flex items-center gap-1"
              >
                + Add file / link
              </button>
            </div>
          </div>
          </SortableActivityItem>
        ))}
      </div>
        </SortableContext>
      </DndContext>
      <div className="mt-1">
        <AddButton label="Add Activity" onClick={add} />
      </div>
    </div>
  );
}

function SortableActivityItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="relative"
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute left-1 top-3 text-muted/30 hover:text-muted cursor-grab active:cursor-grabbing touch-none z-10 text-sm leading-none"
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      <div className="pl-5">{children}</div>
    </div>
  );
}
