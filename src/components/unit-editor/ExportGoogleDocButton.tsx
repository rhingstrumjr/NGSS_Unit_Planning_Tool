'use client';

import { useState } from 'react';
import type { Unit } from '@/lib/types';
import { requestDriveAccessToken } from '@/lib/google/gis';

interface Props {
  unit: Unit;
  onDocCreated: (docUrl: string) => void;
}

type State = 'idle' | 'loading' | 'error';

export function ExportGoogleDocButton({ unit, onDocCreated }: Props) {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const hasDocUrl = !!unit.googleDocUrl;

  async function handleExport() {
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

    await createDoc(accessToken);
  }

  async function createDoc(accessToken: string) {
    setState('loading');
    try {
      const res = await fetch('/api/export/google-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit, accessToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Export failed (${res.status})`);
      }
      onDocCreated(data.docUrl);
      setState('idle');
      window.open(data.docUrl, '_blank');
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Export failed.');
    }
  }

  return (
    <div className="flex items-center gap-2">
      {hasDocUrl && (
        <a
          href={unit.googleDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-teal hover:text-teal-light hover:border-teal/40 transition-colors"
        >
          Open Doc ↗
        </a>
      )}

      <div className="relative">
        <button
          onClick={handleExport}
          disabled={state === 'loading'}
          title={
            state === 'error'
              ? errorMsg
              : hasDocUrl
              ? 'Re-export to Google Docs (creates a new doc)'
              : 'Export to Google Docs'
          }
          className={`px-3 py-1.5 border rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
            state === 'error'
              ? 'bg-red/10 border-red/30 text-red hover:bg-red/20'
              : 'bg-surface border-border text-muted hover:text-foreground hover:border-teal/40'
          }`}
        >
          {state === 'loading' ? (
            <>
              <span className="inline-block w-3 h-3 border border-muted/40 border-t-muted rounded-full animate-spin" />
              Exporting…
            </>
          ) : state === 'error' ? (
            <>⚠ Export Failed</>
          ) : (
            <>
              <GoogleDocsIcon />
              {hasDocUrl ? 'Re-export' : 'Google Doc'}
            </>
          )}
        </button>

        {state === 'error' && (
          <div className="absolute z-50 right-0 top-full mt-1 w-72 bg-surface border border-red/30 rounded-xl shadow-xl p-3">
            <p className="text-sm text-red mb-2">{errorMsg}</p>
            {errorMsg.includes('Settings') ? (
              <a
                href="/settings"
                className="text-sm text-teal hover:text-teal-light underline"
              >
                Go to Settings →
              </a>
            ) : (
              <button
                onClick={() => setState('idle')}
                className="text-sm text-muted hover:text-foreground"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleDocsIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#4285F4" opacity="0.2" />
      <path d="M14 2v6h6" stroke="#4285F4" strokeWidth="1.5" fill="none" />
      <path d="M14 2L20 8" stroke="#4285F4" strokeWidth="1.5" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="15" x2="16" y2="15" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="18" x2="13" y2="18" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
