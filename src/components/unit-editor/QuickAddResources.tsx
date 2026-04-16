'use client';

import { useState, useRef } from 'react';
import { extractUrls } from '@/lib/url-metadata';

interface QuickAddResourcesProps {
  /** Called with one or more URLs pulled from paste / typed input / clipboard. */
  onAddUrls: (urls: string[]) => void;
  /** Fallback for the rare case the user wants an empty labelled row. */
  onAddBlank: () => void;
}

/**
 * Streamlined resource entry for an activity:
 *   - Paste a URL (or many, one per line) → rows created with auto-inferred titles.
 *   - "Paste" button reads the system clipboard (1 click, no typing).
 *   - "+ blank" stays as the escape hatch.
 */
export function QuickAddResources({ onAddUrls, onAddBlank }: QuickAddResourcesProps) {
  const [value, setValue] = useState('');
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(text: string): boolean {
    const urls = extractUrls(text);
    if (urls.length === 0) return false;
    onAddUrls(urls);
    setValue('');
    setClipboardError(null);
    return true;
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    if (commit(pasted)) {
      e.preventDefault();
      // Keep focus so the user can paste another link immediately.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (commit(value)) {
        e.preventDefault();
      }
    }
  }

  async function handleClipboardClick() {
    try {
      const text = await navigator.clipboard.readText();
      if (!commit(text)) {
        setClipboardError('Clipboard has no URL.');
      }
    } catch {
      // Permission denied or unsupported — fall back to focusing the input.
      setClipboardError('Paste into the field instead (Ctrl/Cmd+V).');
      inputRef.current?.focus();
    }
  }

  return (
    <div className="mt-1 space-y-1">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste link(s) — title auto-fills"
          className="flex-1 bg-surface border border-dashed border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal focus:border-solid"
        />
        <button
          type="button"
          onClick={handleClipboardClick}
          title="Paste from clipboard"
          className="px-2 py-1.5 text-sm text-muted hover:text-teal border border-border rounded flex-shrink-0"
        >
          📋 Paste
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={onAddBlank}
          className="text-muted hover:text-teal"
        >
          + blank row
        </button>
        {clipboardError && <span className="text-muted/60">{clipboardError}</span>}
      </div>
    </div>
  );
}
