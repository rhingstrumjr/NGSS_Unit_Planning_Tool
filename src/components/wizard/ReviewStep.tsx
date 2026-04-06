'use client';

interface ReviewStepProps {
  title: string;
  gradeBand: string;
  course: string;
  phenomena: { name: string; isPrimary: boolean }[];
  standardCodes: string[];
  unitDrivingQuestion: string;
  subQuestions: string[];
  loops: { title: string; dqIndex: number; durationDays: number }[];
  targets: string[][];
  onTitleChange: (v: string) => void;
  onCourseChange: (v: string) => void;
}

export function ReviewStep({
  title,
  gradeBand,
  course,
  phenomena,
  standardCodes,
  unitDrivingQuestion,
  subQuestions,
  loops,
  targets,
  onTitleChange,
  onCourseChange,
}: ReviewStepProps) {
  const primaryPhenomenon = phenomena.find((p) => p.isPrimary);
  const totalDays = loops.reduce((s, l) => s + l.durationDays, 0);
  const totalTargets = targets.reduce((s, t) => s + t.filter(Boolean).length, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Unit Overview</h1>
      <p className="text-muted mb-8">
        Here's what you've sketched out. Click <strong className="text-foreground">Start Building</strong> to
        open the full editor with everything pre-filled.
      </p>

      {/* Editable title/course */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Unit Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={primaryPhenomenon?.name ? `${primaryPhenomenon.name} Unit` : 'Enter a unit title...'}
            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted mb-1">Course</label>
            <input
              type="text"
              value={course}
              onChange={(e) => onCourseChange(e.target.value)}
              placeholder="e.g. Chemistry, Biology, Physics..."
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-muted mb-1">Grade Band</label>
            <div className="px-3 py-2 bg-surface-light border border-border rounded-lg text-sm text-foreground">
              {gradeBand || '—'}
            </div>
          </div>
          {totalDays > 0 && (
            <div className="w-32">
              <label className="block text-xs font-medium text-muted mb-1">Est. Duration</label>
              <div className="px-3 py-2 bg-surface-light border border-border rounded-lg text-sm text-foreground">
                ~{totalDays} days
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Phenomena', value: phenomena.length, color: 'text-foreground' },
          { label: 'Standards', value: standardCodes.length, color: 'text-teal-light' },
          { label: 'Loops', value: loops.length, color: 'text-teal-light' },
          { label: 'Targets', value: totalTargets, color: 'text-amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Phenomenon */}
      {primaryPhenomenon && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-3">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Anchoring Phenomenon</p>
          <p className="text-sm text-foreground font-medium">{primaryPhenomenon.name}</p>
        </div>
      )}

      {/* Unit DQ */}
      {unitDrivingQuestion && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-3">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Unit Driving Question</p>
          <p className="text-sm text-foreground italic">"{unitDrivingQuestion}"</p>
        </div>
      )}

      {/* Loop breakdown */}
      {loops.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-3">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">Sensemaking Loops</p>
          <div className="space-y-2">
            {loops.map((loop, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center text-xs text-teal-light font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {loop.title || `Loop ${i + 1}`}
                  </p>
                  <p className="text-xs text-muted">
                    {loop.durationDays} days
                    {loop.dqIndex >= 0 && subQuestions[loop.dqIndex]
                      ? ` · DQ #${loop.dqIndex + 1}`
                      : ''}
                    {targets[i]?.filter(Boolean).length > 0
                      ? ` · ${targets[i].filter(Boolean).length} target${targets[i].filter(Boolean).length !== 1 ? 's' : ''}`
                      : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completeness note */}
      <div className="mt-4 p-4 bg-teal/10 border border-teal/30 rounded-xl">
        <p className="text-sm text-teal-light">
          <strong>Ready to build!</strong> The editor will have all your information pre-filled.
          You can always come back and edit anything — nothing here is permanent.
        </p>
      </div>
    </div>
  );
}
