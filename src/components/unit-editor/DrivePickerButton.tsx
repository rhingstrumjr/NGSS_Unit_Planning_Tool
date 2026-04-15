'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Resource } from '@/lib/types';
import { requestDriveAccessToken } from '@/lib/google/gis';
import { openDrivePicker, pickerDocToResource } from '@/lib/google/picker';

interface Props {
  /** Called once per picked file with a ready-to-append Resource. */
  onPick: (resource: Resource) => void;
  /** Base sort order for the first picked file; subsequent picks increment. */
  nextSortOrder: number;
  className?: string;
}

type State = 'idle' | 'loading' | 'error';

export function DrivePickerButton({ onPick, nextSortOrder, className = '' }: Props) {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? '';

  async function handleClick() {
    if (!apiKey) {
      setState('error');
      setErrorMsg(
        'Google Picker is unavailable — set NEXT_PUBLIC_GOOGLE_API_KEY in your environment.'
      );
      return;
    }

    setState('loading');
    setErrorMsg('');

    let accessToken: string;
    try {
      accessToken = await requestDriveAccessToken();
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed.');
      return;
    }

    try {
      await openDrivePicker({
        accessToken,
        apiKey,
        onPicked: (docs) => {
          if (docs.length === 0) {
            setState('idle');
            return;
          }
          docs.forEach((doc, i) => {
            const base = pickerDocToResource(doc);
            onPick({
              id: uuid(),
              sortOrder: nextSortOrder + i,
              ...base,
            });
          });
          setState('idle');
        },
      });
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to open picker.');
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'loading'}
        title={
          state === 'error'
            ? errorMsg
            : 'Pick files from your Google Drive'
        }
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          state === 'error'
            ? 'bg-red/10 border-red/30 text-red'
            : 'bg-surface border-border text-muted hover:text-teal hover:border-teal/40'
        }`}
      >
        {state === 'loading' ? (
          <>
            <span className="inline-block w-3 h-3 border border-muted/40 border-t-muted rounded-full animate-spin" />
            Opening Drive…
          </>
        ) : state === 'error' ? (
          <>⚠ Drive</>
        ) : (
          <>
            <DriveIcon />
            From Drive
          </>
        )}
      </button>

      {state === 'error' && (
        <div className="absolute z-50 left-0 top-full mt-1 w-72 bg-surface border border-red/30 rounded-xl shadow-xl p-3">
          <p className="text-sm text-red mb-2">{errorMsg}</p>
          <button
            onClick={() => setState('idle')}
            className="text-sm text-muted hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function DriveIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 3h9l5.5 9.5L16.5 22h-9L2 12.5 7.5 3z" fill="#4285F4" opacity="0.15" />
      <path d="M7.5 3L2 12.5 7.5 22" stroke="#0F9D58" strokeWidth="1.5" fill="none" />
      <path d="M16.5 3L22 12.5 16.5 22" stroke="#F4B400" strokeWidth="1.5" fill="none" />
      <path d="M2 12.5h20" stroke="#4285F4" strokeWidth="1.5" />
    </svg>
  );
}
