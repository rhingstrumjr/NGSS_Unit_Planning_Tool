'use client';

interface EntryPointStepProps {
  value: 'standards' | 'phenomenon' | null;
  onChange: (v: 'standards' | 'phenomenon') => void;
}

export function EntryPointStep({ value, onChange }: EntryPointStepProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Create a New Unit</h1>
      <p className="text-muted mb-8">Where would you like to start?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onChange('phenomenon')}
          className={`text-left p-6 rounded-xl border-2 transition-all ${
            value === 'phenomenon'
              ? 'border-teal bg-teal/10'
              : 'border-border hover:border-teal/40 bg-surface'
          }`}
        >
          <div className="text-3xl mb-3">🔭</div>
          <h2 className="font-semibold text-foreground text-lg mb-2">I have a phenomenon</h2>
          <p className="text-muted text-sm">
            Start with an anchoring phenomenon — something observable and puzzling for students. We'll help you connect it to NGSS standards.
          </p>
        </button>

        <button
          onClick={() => onChange('standards')}
          className={`text-left p-6 rounded-xl border-2 transition-all ${
            value === 'standards'
              ? 'border-teal bg-teal/10'
              : 'border-border hover:border-teal/40 bg-surface'
          }`}
        >
          <div className="text-3xl mb-3">📋</div>
          <h2 className="font-semibold text-foreground text-lg mb-2">I have standards to teach</h2>
          <p className="text-muted text-sm">
            Start by selecting the Performance Expectations you need to address. We'll help you find phenomena that make them come alive.
          </p>
        </button>
      </div>

      <div className="mt-8 p-4 bg-surface-light rounded-lg border border-border">
        <p className="text-muted text-sm">
          <span className="text-teal-light font-medium">Tip:</span> The best NGSS units anchor in a
          real-world phenomenon that drives student curiosity. You can always connect standards later.
        </p>
      </div>
    </div>
  );
}
