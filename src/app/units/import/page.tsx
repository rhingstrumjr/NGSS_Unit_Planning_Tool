'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseMarkdownV2, collectParseWarnings } from '@/lib/parser/markdown-parser';
import { generateAiPrompt } from '@/lib/parser/ai-prompt-template';
import { saveUnit } from '@/lib/storage';
import type { Unit } from '@/lib/types';

export default function ImportPage() {
  const router = useRouter();
  const [markdown, setMarkdown] = useState('');
  const [parsed, setParsed] = useState<Unit | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processMarkdown = useCallback((text: string) => {
    setMarkdown(text);
    if (!text.trim()) {
      setParsed(null);
      setWarnings([]);
      setParseError(null);
      return;
    }
    try {
      const unit = parseMarkdownV2(text);
      const warns = collectParseWarnings(unit);
      setParsed(unit);
      setWarnings(warns);
      setParseError(null);
    } catch (err) {
      setParsed(null);
      setWarnings([]);
      setParseError(err instanceof Error ? err.message : 'Failed to parse markdown');
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    processMarkdown(e.target.value);
  };

  const handleFileRead = (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setParseError('Please upload a .md or .txt file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processMarkdown(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileRead(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleImport = () => {
    if (!parsed) return;
    saveUnit(parsed);
    router.push(`/units/${parsed.id}`);
  };

  const handleCopyPrompt = async () => {
    const prompt = generateAiPrompt({});
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loopCount = parsed?.loops.length ?? 0;
  const targetCount = parsed?.loops.reduce((sum, l) => sum + l.targets.length, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <a href="/" className="text-muted hover:text-foreground text-sm mb-3 inline-flex items-center gap-1 transition-colors">
            ← Back to units
          </a>
          <h1 className="text-2xl font-bold text-foreground">Import from Markdown</h1>
          <p className="text-muted text-sm mt-1">
            Paste or upload an AI-generated v2+ markdown file to populate the unit editor
          </p>
        </div>
        <button
          onClick={handleCopyPrompt}
          className="flex items-center gap-2 px-4 py-2 bg-surface-light hover:bg-border rounded-lg text-sm font-medium transition-colors border border-border"
        >
          <span>{copied ? '✓ Copied!' : '✨ Copy AI Prompt'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="flex flex-col gap-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-teal bg-teal/10 text-teal-light'
                : 'border-border hover:border-teal/50 text-muted hover:text-foreground'
            }`}
          >
            <div className="text-3xl mb-2">📄</div>
            <p className="font-medium">Drop .md file here</p>
            <p className="text-xs mt-1">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          <div className="text-center text-muted text-xs">— or paste below —</div>

          {/* Textarea */}
          <textarea
            value={markdown}
            onChange={handleTextChange}
            placeholder={`# Unit Title\n\n## §1. Unit Overview\n\n- **Phenomenon:** ...\n- **Description:** ...\n...`}
            className="w-full h-96 bg-surface border border-border rounded-lg px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50 resize-none"
          />
        </div>

        {/* Right: Preview */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Preview</h2>

          {!markdown.trim() && (
            <div className="bg-surface border border-border rounded-lg px-6 py-10 text-center text-muted text-sm">
              Paste markdown or drop a file to see a preview
            </div>
          )}

          {parseError && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
              <span className="font-semibold">Parse error:</span> {parseError}
            </div>
          )}

          {parsed && (
            <>
              {/* Summary card */}
              <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">Title</p>
                  <p className="font-semibold text-foreground">{parsed.title || '(untitled)'}</p>
                </div>

                {parsed.phenomena.find(p => p.isPrimary)?.name && (
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide mb-1">Anchoring Phenomenon</p>
                    <p className="text-sm text-foreground">{parsed.phenomena.find(p => p.isPrimary)!.name}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <StatBox label="Loops" value={loopCount} color="teal" />
                  <StatBox label="Targets" value={targetCount} color="amber" />
                  <StatBox label="Standards" value={parsed.standards.length} color="purple" />
                </div>

                {parsed.gradeBand && (
                  <div className="flex gap-4 text-sm text-muted pt-1">
                    <span>Grade Band: <span className="text-foreground">{parsed.gradeBand}</span></span>
                    {parsed.course && <span>Course: <span className="text-foreground">{parsed.course}</span></span>}
                  </div>
                )}
              </div>

              {/* Loop breakdown */}
              {loopCount > 0 && (
                <div className="bg-surface border border-border rounded-lg p-4">
                  <p className="text-xs text-muted uppercase tracking-wide mb-3">Sensemaking Loops</p>
                  <div className="space-y-1">
                    {parsed.loops.map((loop, i) => (
                      <div key={loop.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          <span className="text-teal-light mr-2">Loop {i + 1}</span>
                          {loop.title || '(untitled)'}
                        </span>
                        <span className="text-muted">{loop.targets.length} target{loop.targets.length !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-amber/10 border border-amber/30 rounded-lg p-4">
                  <p className="text-xs font-semibold text-amber uppercase tracking-wide mb-2">
                    {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i} className="text-sm text-amber/80 flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">⚠</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Import button */}
              <button
                onClick={handleImport}
                className="w-full py-3 bg-teal hover:bg-teal/80 text-white font-semibold rounded-lg transition-colors"
              >
                Import &amp; Open in Builder
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI prompt instructions */}
      <div className="mt-10 bg-surface border border-border rounded-lg p-6">
        <h2 className="font-semibold text-foreground mb-3">How to generate a unit with AI</h2>
        <ol className="space-y-2 text-sm text-muted">
          <li className="flex gap-3">
            <span className="text-teal-light font-bold shrink-0">1.</span>
            Click <strong className="text-foreground">Copy AI Prompt</strong> above to copy a ready-to-paste prompt to your clipboard
          </li>
          <li className="flex gap-3">
            <span className="text-teal-light font-bold shrink-0">2.</span>
            Open Claude, ChatGPT, or Gemini and paste the prompt — customize the grade band, course, phenomenon, and standards
          </li>
          <li className="flex gap-3">
            <span className="text-teal-light font-bold shrink-0">3.</span>
            The AI will generate a complete unit in v2+ markdown format
          </li>
          <li className="flex gap-3">
            <span className="text-teal-light font-bold shrink-0">4.</span>
            Copy the markdown output, paste it in the box above, and click <strong className="text-foreground">Import &amp; Open in Builder</strong>
          </li>
        </ol>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: 'teal' | 'amber' | 'purple' }) {
  const colorClasses = {
    teal: 'border-teal/40 text-teal-light',
    amber: 'border-amber/40 text-amber',
    purple: 'border-purple/40 text-purple-light',
  };
  return (
    <div className={`border rounded-lg p-2 text-center ${colorClasses[color]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
