'use client';

export interface Tab {
  id: string;
  label: string;
  badge?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  trailing?: React.ReactNode;
}

export function Tabs({ tabs, activeTab, onChange, trailing }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 text-base font-medium transition-colors relative ${
              active
                ? 'text-teal'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-1.5 text-sm text-muted">({tab.badge})</span>
            )}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal rounded-t" />
            )}
          </button>
        );
      })}
      {trailing && <div className="ml-auto pr-2">{trailing}</div>}
    </div>
  );
}
