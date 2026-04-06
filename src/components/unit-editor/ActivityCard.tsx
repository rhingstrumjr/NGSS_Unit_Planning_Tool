'use client';

import { v4 as uuid } from 'uuid';
import type { Activity, ActivityType, Resource } from '@/lib/types';
import { createBlankActivity } from '@/lib/defaults';
import { AddButton } from '@/components/ui/AddButton';
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

interface ActivityListProps {
  activities: Activity[];
  onChange: (activities: Activity[]) => void;
  aiContext?: AiContext;
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

export function ActivityList({ activities, onChange, aiContext }: ActivityListProps) {
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

  return (
    <div>
      <label className="block text-sm text-muted mb-1">Activities</label>
      <div className="space-y-2">
        {activities.map((act) => (
          <div
            key={act.id}
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
        ))}
      </div>
      <div className="mt-1">
        <AddButton label="Add Activity" onClick={add} />
      </div>
    </div>
  );
}
