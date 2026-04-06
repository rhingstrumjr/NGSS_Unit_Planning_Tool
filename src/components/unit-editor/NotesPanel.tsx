'use client';

import { useState } from 'react';
import type { Unit, TeacherNote } from '@/lib/types';
import { createBlankNote } from '@/lib/defaults';

interface NotesPanelProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

const noteColors = {
  yellow: { bg: 'bg-amber/20', border: 'border-amber/40', label: 'Idea' },
  blue: { bg: 'bg-blue-400/20', border: 'border-blue-400/40', label: 'Question' },
  green: { bg: 'bg-green/20', border: 'border-green/40', label: 'Done' },
  red: { bg: 'bg-red/20', border: 'border-red/40', label: 'Blocker' },
};

export function NotesPanel({ unit, updateUnit }: NotesPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  function addNote() {
    updateUnit((prev) => ({
      ...prev,
      notes: [...prev.notes, createBlankNote()],
    }));
  }

  function updateNote(id: string, changes: Partial<TeacherNote>) {
    updateUnit((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, ...changes } : n)),
    }));
  }

  function removeNote(id: string) {
    updateUnit((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-10 flex-shrink-0 border-l border-border bg-surface flex flex-col items-center pt-4 gap-1 hover:bg-surface-light transition-colors"
        title="Open Notes"
      >
        <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="text-muted text-sm [writing-mode:vertical-lr]">Notes</span>
      </button>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-surface overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-base">Teacher Notes</h3>
        <button
          onClick={() => setCollapsed(true)}
          className="text-muted hover:text-foreground text-sm"
          title="Collapse"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-3 space-y-2">
        {unit.notes.map((note) => {
          const color = noteColors[note.color];
          return (
            <div
              key={note.id}
              className={`${color.bg} border ${color.border} rounded-lg p-3 relative group`}
            >
              <div className="flex items-center gap-2 mb-2">
                {(Object.keys(noteColors) as TeacherNote['color'][]).map((c) => (
                  <button
                    key={c}
                    onClick={() => updateNote(note.id, { color: c })}
                    className={`w-3 h-3 rounded-full border ${
                      c === note.color ? 'ring-2 ring-white/50' : ''
                    }`}
                    style={{
                      backgroundColor:
                        c === 'yellow' ? '#f5c518' : c === 'blue' ? '#60a5fa' : c === 'green' ? '#6ee7b7' : '#f87171',
                    }}
                  />
                ))}
                <span className="text-sm text-muted ml-auto">
                  {color.label}
                </span>
                <button
                  onClick={() => removeNote(note.id)}
                  className="text-muted hover:text-red text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
              <textarea
                value={note.text}
                onChange={(e) => updateNote(note.id, { text: e.target.value })}
                placeholder="Write a note..."
                className="w-full bg-transparent text-base resize-none focus:outline-none min-h-[40px]"
                rows={2}
              />
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <button
          onClick={addNote}
          className="w-full text-base text-teal hover:text-teal-light flex items-center justify-center gap-1 py-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Note
        </button>
      </div>
    </div>
  );
}
