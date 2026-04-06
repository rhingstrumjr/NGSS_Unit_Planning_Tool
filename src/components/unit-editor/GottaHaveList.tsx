'use client';

import type { GottaHaveItem } from '@/lib/types';
import { createBlankGottaHaveItem } from '@/lib/defaults';
import { AddButton } from '@/components/ui/AddButton';

interface GottaHaveListProps {
  items: GottaHaveItem[];
  onChange: (items: GottaHaveItem[]) => void;
}

export function GottaHaveList({ items, onChange }: GottaHaveListProps) {
  function update(id: string, changes: Partial<GottaHaveItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }

  function add() {
    onChange([...items, createBlankGottaHaveItem(items.length)]);
  }

  function remove(id: string) {
    onChange(
      items
        .filter((item) => item.id !== id)
        .map((item, i) => ({ ...item, sortOrder: i }))
    );
  }

  return (
    <div>
      <label className="block text-xs text-muted mb-1">
        Gotta-Have-It Checklist
      </label>
      <p className="text-xs text-muted mb-2">
        Key ideas that must be in a complete explanation of the phenomenon.
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => update(item.id, { checked: e.target.checked })}
              className="accent-teal"
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => update(item.id, { text: e.target.value })}
              placeholder="An idea students need to include..."
              className={`flex-1 bg-surface border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-teal ${
                item.checked ? 'line-through text-muted' : ''
              }`}
            />
            <button
              onClick={() => remove(item.id)}
              className="text-muted hover:text-red text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <div className="mt-1">
        <AddButton label="Add Item" onClick={add} />
      </div>
    </div>
  );
}
