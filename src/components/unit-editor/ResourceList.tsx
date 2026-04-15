'use client';

import type { Resource } from '@/lib/types';
import { createBlankResource } from '@/lib/defaults';
import { AddButton } from '@/components/ui/AddButton';
import { DrivePickerButton } from './DrivePickerButton';

interface ResourceListProps {
  resources: Resource[];
  onChange: (resources: Resource[]) => void;
  label?: string;
  helpText?: string;
}

export function ResourceList({ resources, onChange, label = 'Resources', helpText }: ResourceListProps) {
  function update(id: string, changes: Partial<Resource>) {
    onChange(resources.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  function add() {
    onChange([...resources, createBlankResource(resources.length)]);
  }

  function addFromPicker(resource: Resource) {
    onChange([...resources, resource]);
  }

  function remove(id: string) {
    onChange(
      resources
        .filter((r) => r.id !== id)
        .map((r, i) => ({ ...r, sortOrder: i }))
    );
  }

  return (
    <div>
      <label className="block text-sm text-muted mb-0.5">{label}</label>
      {helpText && <p className="text-xs text-muted/60 mb-1">{helpText}</p>}
      <div className="space-y-2">
        {resources.map((res) => (
          <div
            key={res.id}
            className="flex items-center gap-2 bg-surface-light/20 rounded p-2"
          >
            <input
              type="text"
              value={res.title}
              onChange={(e) => update(res.id, { title: e.target.value })}
              placeholder="Title"
              className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
            />
            <input
              type="url"
              value={res.url}
              onChange={(e) => update(res.id, { url: e.target.value })}
              placeholder="URL"
              className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
            />
            <button
              onClick={() => remove(res.id)}
              className="text-muted hover:text-red text-sm flex-shrink-0"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <AddButton label="Add Resource" onClick={add} />
        <DrivePickerButton
          nextSortOrder={resources.length}
          onPick={addFromPicker}
        />
      </div>
    </div>
  );
}
