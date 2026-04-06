'use client';

interface PhenomenonDraft {
  name: string;
  description: string;
  mediaUrl: string;
  isPrimary: boolean;
}

interface PhenomenaStepProps {
  phenomena: PhenomenonDraft[];
  onChange: (phenomena: PhenomenonDraft[]) => void;
}

export function PhenomenaStep({ phenomena, onChange }: PhenomenaStepProps) {
  function add() {
    onChange([...phenomena, { name: '', description: '', mediaUrl: '', isPrimary: false }]);
  }

  function remove(i: number) {
    const next = phenomena.filter((_, idx) => idx !== i);
    // Ensure at least one is primary
    if (phenomena[i].isPrimary && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  }

  function update(i: number, field: keyof PhenomenonDraft, value: string | boolean) {
    onChange(phenomena.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  function setPrimary(i: number) {
    onChange(phenomena.map((p, idx) => ({ ...p, isPrimary: idx === i })));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Anchoring Phenomenon</h1>
      <p className="text-muted mb-6">
        Describe the phenomenon your students will investigate. You can add multiple phenomena —
        star the one that will anchor the whole unit.
      </p>

      <div className="space-y-4">
        {phenomena.map((p, i) => (
          <div
            key={i}
            className={`rounded-xl border-2 p-5 transition-all ${
              p.isPrimary ? 'border-teal/60 bg-teal/5' : 'border-border bg-surface'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setPrimary(i)}
                title={p.isPrimary ? 'Primary phenomenon' : 'Set as primary'}
                className={`text-xl transition-colors ${p.isPrimary ? 'text-amber' : 'text-muted hover:text-amber'}`}
              >
                {p.isPrimary ? '★' : '☆'}
              </button>
              {p.isPrimary && (
                <span className="text-xs text-teal-light font-semibold px-2 py-0.5 bg-teal/20 rounded">
                  Anchoring Phenomenon
                </span>
              )}
              {phenomena.length > 1 && (
                <button
                  onClick={() => remove(i)}
                  className="text-muted hover:text-red text-sm transition-colors ml-auto"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Phenomenon Name</label>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => update(i, 'name', e.target.value)}
                  placeholder="e.g. Airbags inflating in a crash"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Description</label>
                <textarea
                  value={p.description}
                  onChange={(e) => update(i, 'description', e.target.value)}
                  placeholder="Describe what happens and why it's puzzling for students..."
                  rows={3}
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Media URL (optional)</label>
                <input
                  type="url"
                  value={p.mediaUrl}
                  onChange={(e) => update(i, 'mediaUrl', e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="mt-4 flex items-center gap-2 text-sm text-teal-light hover:text-teal transition-colors"
      >
        <span className="text-lg font-bold">+</span> Add another phenomenon
      </button>

      <div className="mt-6 p-4 bg-surface-light rounded-lg border border-border">
        <p className="text-muted text-sm">
          <span className="text-teal-light font-medium">Tip:</span> Extra phenomena can become
          investigative phenomena within specific loops — a smaller version of the mystery that
          scaffolds toward the big anchor.
        </p>
      </div>
    </div>
  );
}
