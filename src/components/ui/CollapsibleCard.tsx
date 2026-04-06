'use client';

import { useState } from 'react';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  borderColor?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  'data-section-id'?: string;
}

export function CollapsibleCard({
  title,
  subtitle,
  defaultOpen = false,
  borderColor = 'border-l-teal',
  headerExtra,
  children,
  ...props
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`bg-surface rounded-xl border border-border border-l-4 ${borderColor} mb-4`}
      data-section-id={props['data-section-id']}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-light/30 transition-colors rounded-t-xl"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          {subtitle && (
            <p className="text-muted text-base mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3">
          {headerExtra}
          <svg
            className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
