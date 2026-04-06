'use client';

interface LoopDraft {
  title: string;
  dqIndex: number;
  durationDays: number;
}

interface TargetSketchStepProps {
  loops: LoopDraft[];
  targets: string[][];   // targets[loopIndex] = array of target title strings
  onChange: (targets: string[][]) => void;
}

export function TargetSketchStep({ loops, targets, onChange }: TargetSketchStepProps) {
  function updateTarget(loopIdx: number, targetIdx: number, val: string) {
    const next = targets.map((ts, li) =>
      li === loopIdx ? ts.map((t, ti) => (ti === targetIdx ? val : t)) : ts
    );
    onChange(next);
  }

  function addTarget(loopIdx: number) {
    const next = targets.map((ts, li) => (li === loopIdx ? [...ts, ''] : ts));
    onChange(next);
  }

  function removeTarget(loopIdx: number, targetIdx: number) {
    const next = targets.map((ts, li) =>
      li === loopIdx ? ts.filter((_, ti) => ti !== targetIdx) : ts
    );
    onChange(next);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Learning Targets</h1>
      <p className="text-muted mb-6">
        Sketch out the learning targets for each loop — the key ideas or skills students will build.
        These are rough drafts; you'll refine them in the builder.
      </p>

      <div className="space-y-6">
        {loops.map((loop, li) => (
          <div key={li} className="bg-surface border border-teal/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold shrink-0">
                {li + 1}
              </div>
              <h3 className="font-semibold text-foreground">
                {loop.title || `Loop ${li + 1}`}
              </h3>
            </div>

            <div className="space-y-2">
              {(targets[li] || []).map((target, ti) => (
                <div key={ti} className="flex items-center gap-2">
                  <span className="text-xs text-muted font-mono w-6 shrink-0 text-right">
                    {li + 1}.{ti + 1}
                  </span>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => updateTarget(li, ti, e.target.value)}
                    placeholder={`Learning target ${li + 1}.${ti + 1}...`}
                    className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-amber/50"
                  />
                  <button
                    onClick={() => removeTarget(li, ti)}
                    className="text-muted hover:text-red transition-colors text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addTarget(li)}
              className="mt-3 flex items-center gap-2 text-sm text-amber/80 hover:text-amber transition-colors"
            >
              <span className="text-base font-bold">+</span> Add target to Loop {li + 1}
            </button>
          </div>
        ))}
      </div>

      {loops.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">
          Go back and add at least one loop first.
        </div>
      )}

      <div className="mt-6 p-4 bg-surface-light rounded-lg border border-border">
        <p className="text-muted text-sm">
          <span className="text-amber font-medium">Tip:</span> Aim for 2–3 targets per loop. Each
          target should integrate a science idea (DCI), a practice (SEP), and a cross-cutting concept
          (CCC). You'll specify the 3D alignment in the builder.
        </p>
      </div>
    </div>
  );
}
