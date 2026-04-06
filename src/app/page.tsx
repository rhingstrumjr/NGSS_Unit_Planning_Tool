'use client';

import { useRouter } from 'next/navigation';
import { useUnitList } from '@/lib/hooks/useUnitList';
import { createBlankUnit } from '@/lib/defaults';
import { saveUnit } from '@/lib/storage';
import { useRef } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { units, loading, deleteUnit, importJson, exportJson } = useUnitList();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleNewUnit() {
    router.push('/units/new');
  }

  function handleQuickCreate() {
    const unit = createBlankUnit();
    saveUnit(unit);
    router.push(`/units/${unit.id}`);
  }

  function handleDelete(id: string, title: string) {
    if (confirm(`Delete "${title || 'Untitled Unit'}"? This cannot be undone.`)) {
      deleteUnit(id);
    }
  }

  function handleExport() {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngss-units-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const count = importJson(reader.result as string);
        alert(`Imported ${count} unit(s).`);
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const primaryPhenomenon = (unit: typeof units[number]) =>
    unit.phenomena?.find((p) => p.isPrimary)?.name || 'No phenomenon set';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Units</h1>
        <div className="flex gap-3">
          <button
            onClick={handleNewUnit}
            className="bg-teal hover:bg-teal-light text-white px-4 py-2 rounded-lg font-semibold text-base transition-colors"
          >
            + New Unit
          </button>
          <a
            href="/units/import"
            className="bg-surface-light hover:bg-border text-foreground px-4 py-2 rounded-lg font-semibold text-base transition-colors inline-flex items-center"
          >
            Import Markdown
          </a>
          <button
            onClick={handleQuickCreate}
            className="bg-surface-light hover:bg-border text-foreground px-4 py-2 rounded-lg font-semibold text-base transition-colors"
          >
            Blank Unit
          </button>
        </div>
      </div>

      {/* Unit cards */}
      {units.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted text-xl mb-2">No units yet.</p>
          <p className="text-muted text-base mb-6">
            Create a new unit with the wizard, import from markdown, or start from a blank slate.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleNewUnit}
              className="bg-teal hover:bg-teal-light text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + New Unit
            </button>
            <button
              onClick={handleQuickCreate}
              className="bg-surface-light hover:bg-border text-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Blank Unit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="bg-surface rounded-xl border border-border p-5 hover:border-teal transition-colors cursor-pointer group"
              onClick={() => router.push(`/units/${unit.id}`)}
            >
              <h3 className="font-semibold text-xl mb-1 truncate">
                {unit.title || 'Untitled Unit'}
              </h3>
              <p className="text-muted text-base mb-3 truncate">
                {primaryPhenomenon(unit)}
              </p>
              <div className="flex items-center gap-3 text-sm text-muted mb-3">
                {unit.gradeBand && (
                  <span className="bg-surface-light px-2 py-0.5 rounded">
                    {unit.gradeBand}
                  </span>
                )}
                <span>{unit.loops?.length || 0} loops</span>
                <span>
                  {unit.loops?.reduce(
                    (sum, l) => sum + (l.targets?.length || 0),
                    0
                  ) || 0}{' '}
                  targets
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  {new Date(unit.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(unit.id, unit.title);
                  }}
                  className="text-sm text-red opacity-0 group-hover:opacity-100 hover:underline transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="mt-8 flex items-center gap-3 text-base">
        <button
          onClick={handleExport}
          className="text-muted hover:text-foreground transition-colors"
        >
          Export All as JSON
        </button>
        <span className="text-border">|</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-muted hover:text-foreground transition-colors"
        >
          Import from JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </div>
  );
}
