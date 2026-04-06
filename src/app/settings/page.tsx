'use client';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <a href="/" className="text-muted hover:text-foreground text-base mb-6 inline-flex items-center gap-1 transition-colors">
        ← Back
      </a>
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

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
