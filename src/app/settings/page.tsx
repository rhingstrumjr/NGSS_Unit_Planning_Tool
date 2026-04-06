'use client';

import { useState, useEffect } from 'react';

const API_KEY_STORAGE = 'ngss-gemini-key';

export default function SettingsPage() {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE) ?? '';
    setHasKey(!!stored);
  }, []);

  function handleSave() {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE, key.trim());
      setHasKey(true);
      setKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleClear() {
    if (confirm('Remove your Anthropic API key?')) {
      localStorage.removeItem(API_KEY_STORAGE);
      setHasKey(false);
      setKey('');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <a href="/" className="text-muted hover:text-foreground text-base mb-6 inline-flex items-center gap-1 transition-colors">
        ← Back
      </a>
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      {/* AI Section */}
      <section className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-1">AI Suggestions</h2>
        <p className="text-base text-muted mb-5">
          Enter your Google AI API key to enable inline AI suggestions throughout the unit builder.
          Your key is stored only in your browser's localStorage and is never sent to any server
          other than the Google AI API directly.
        </p>

        {hasKey ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-surface-light border border-border rounded-lg px-4 py-2.5 text-base text-green">
              ✓ API key saved
            </div>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-surface-light hover:bg-border text-muted text-base rounded-lg transition-colors border border-border"
            >
              Remove key
            </button>
          </div>
        ) : (
          <div className="mb-4 text-base text-muted italic">No API key saved yet.</div>
        )}

        <div className="flex gap-3">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={hasKey ? 'Enter a new key to replace...' : 'AIza...'}
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-base text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
          />
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="px-4 py-2 bg-teal hover:bg-teal-light text-white text-base font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saved ? '✓ Saved' : 'Save Key'}
          </button>
        </div>

        <p className="text-sm text-muted mt-3">
          Get a key at{' '}
          <span className="text-teal-light">aistudio.google.com/apikey</span>.
          The planner uses <span className="font-mono">gemini-3.1-flash-lite-preview</span> for fast, low-cost suggestions.
        </p>
      </section>

      {/* Data section */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-1">Data & Storage</h2>
        <p className="text-base text-muted mb-4">
          All unit data is stored in your browser's localStorage. Use the export feature on the home page
          to back up your units as JSON.
        </p>
        <div className="text-sm text-muted space-y-1">
          <p>• Data stays in your browser — no account required</p>
          <p>• Export JSON from the home page to back up or share between browsers</p>
          <p>• Clearing browser data will delete your units</p>
        </div>
      </section>
    </div>
  );
}
