'use client';

interface WizardShellProps {
  step: number;
  totalSteps: number;
  stepLabels: string[];
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
  canNext: boolean;
  isLastStep: boolean;
  children: React.ReactNode;
}

export function WizardShell({
  step,
  totalSteps,
  stepLabels,
  onPrev,
  onNext,
  onComplete,
  canNext,
  isLastStep,
  children,
}: WizardShellProps) {
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="h-[calc(100vh-53px)] flex flex-col">
      {/* Progress bar */}
      <div className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-medium">
              Step {step + 1} of {totalSteps}
            </span>
            <span className="text-xs text-muted">{stepLabels[step]}</span>
          </div>
          <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex gap-2 mt-3">
            {stepLabels.map((label, i) => (
              <div
                key={i}
                className={`flex-1 text-center text-xs py-0.5 rounded transition-colors ${
                  i === step
                    ? 'text-teal-light font-semibold'
                    : i < step
                    ? 'text-muted'
                    : 'text-muted/50'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                  i < step ? 'bg-teal' : i === step ? 'bg-teal-light' : 'bg-border'
                }`} />
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {children}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-surface border-t border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={step === 0}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-surface-light hover:bg-border text-foreground"
          >
            ← Back
          </button>

          {isLastStep ? (
            <button
              onClick={onComplete}
              disabled={!canNext}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-teal hover:bg-teal-light text-white"
            >
              Start Building →
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!canNext}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-teal hover:bg-teal-light text-white"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
