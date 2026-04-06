'use client';

interface LoopDraft {
  title: string;
  dqIndex: number;   // 0-based index into subQuestions (-1 = none)
  durationDays: number;
}

interface LoopSkeletonStepProps {
  loops: LoopDraft[];
  subQuestions: string[];
  onChange: (loops: LoopDraft[]) => void;
}

export function LoopSkeletonStep({ loops, subQuestions, onChange }: LoopSkeletonStepProps) {
  function add() {
    onChange([...loops, { title: '', dqIndex: -1, durationDays: 4 }]);
  }

  function remove(i: number) {
    onChange(loops.filter((_, idx) => idx !== i));
  }

  function update(i: number, field: keyof LoopDraft, value: string | number) {
    onChange(loops.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  const totalDays = loops.reduce((s, l) => s + (l.durationDays || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Unit Arc</h1>
      <p className="text-muted mb-6">
        Sketch out your sensemaking loops — the major instructional episodes of the unit. Each loop
        addresses one or more driving questions.
      </p>

      {/* Visual arc */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {loops.map((loop, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center">
              <div className="w-20 h-16 rounded-lg border-2 border-teal/60 bg-teal/10 flex flex-col items-center justify-center text-center px-1">
                <span className="text-xs text-teal-light font-bold">Loop {i + 1}</span>
                {loop.dqIndex >= 0 && loop.dqIndex < subQuestions.length && (
                  <span className="text-xs text-muted">DQ #{loop.dqIndex + 1}</span>
                )}
                <span className="text-xs text-muted">{loop.durationDays}d</span>
              </div>
            </div>
            {i < loops.length - 1 && (
              <span className="text-muted text-lg shrink-0">→</span>
            )}
          </div>
        ))}
        {loops.length > 0 && (
          <>
            <span className="text-muted text-lg shrink-0">→</span>
            <div className="w-20 h-16 rounded-lg border-2 border-amber/60 bg-amber/10 flex items-center justify-center shrink-0">
              <span className="text-xs text-amber font-bold text-center px-1">Transfer Task</span>
            </div>
          </>
        )}
      </div>

      {/* Loop cards */}
      <div className="space-y-3">
        {loops.map((loop, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-teal-light w-16 shrink-0">Loop {i + 1}</span>
              <input
                type="text"
                value={loop.title}
                onChange={(e) => update(i, 'title', e.target.value)}
                placeholder={`Loop ${i + 1} title...`}
                className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
              />
              <button
                onClick={() => remove(i)}
                className="text-muted hover:text-red transition-colors text-sm shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1">Addresses which DQ?</label>
                <select
                  value={loop.dqIndex}
                  onChange={(e) => update(i, 'dqIndex', Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-teal/50"
                >
                  <option value={-1}>None / TBD</option>
                  {subQuestions.map((q, qi) => (
                    <option key={qi} value={qi}>
                      #{qi + 1}{q ? `: ${q.slice(0, 50)}${q.length > 50 ? '...' : ''}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs text-muted mb-1">Est. days</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={loop.durationDays}
                  onChange={(e) => update(i, 'durationDays', Number(e.target.value))}
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-teal/50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={add}
          className="flex items-center gap-2 text-sm text-teal-light hover:text-teal transition-colors"
        >
          <span className="text-lg font-bold">+</span> Add loop
        </button>
        {totalDays > 0 && (
          <span className="text-xs text-muted">Total: ~{totalDays} days</span>
        )}
      </div>

      <div className="mt-6 p-4 bg-surface-light rounded-lg border border-border">
        <p className="text-muted text-sm">
          <span className="text-teal-light font-medium">Tip:</span> Aim for 2–4 loops. Each loop should
          move students closer to being able to explain the anchoring phenomenon. The transfer task at
          the end is when students apply their complete understanding.
        </p>
      </div>
    </div>
  );
}
