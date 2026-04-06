'use client';

import type { Unit } from '@/lib/types';

type MainTab = 'overview' | 'loops' | 'wrapup';

interface OutlineSidebarProps {
  unit: Unit;
  activeTab: MainTab;
  activeLoopIndex: number;
  onNavigate: (tab: MainTab, loopIndex?: number) => void;
}

export function OutlineSidebar({
  unit,
  activeTab,
  activeLoopIndex,
  onNavigate,
}: OutlineSidebarProps) {
  const primary = unit.phenomena?.find((p) => p.isPrimary);

  return (
    <nav className="w-60 flex-shrink-0 border-r border-border bg-surface overflow-y-auto p-4">
      <div className="mb-4">
        <h2 className="font-semibold text-base truncate">
          {unit.title || 'Untitled Unit'}
        </h2>
        {primary?.name && (
          <p className="text-muted text-sm truncate mt-0.5">{primary.name}</p>
        )}
      </div>

      <ul className="space-y-0.5 text-base">
        {/* Overview section */}
        <SidebarItem
          label="Phenomenon"
          active={activeTab === 'overview'}
          onClick={() => onNavigate('overview')}
        />
        <SidebarItem
          label="Standards & Overview"
          active={activeTab === 'overview'}
          onClick={() => onNavigate('overview')}
          muted
        />
        <SidebarItem
          label={`Driving Questions (${unit.drivingQuestions?.length || 0})`}
          active={activeTab === 'overview'}
          onClick={() => onNavigate('overview')}
        />

        {/* Loops */}
        <li className="pt-2">
          <span className="block px-3 py-1 text-sm font-semibold text-muted uppercase tracking-wide">
            Sensemaking Loops
          </span>
        </li>
        {unit.loops?.map((loop, i) => (
          <li key={loop.id}>
            <button
              onClick={() => onNavigate('loops', i)}
              className={`w-full text-left px-3 py-2 rounded transition-colors font-medium ${
                activeTab === 'loops' && activeLoopIndex === i
                  ? 'bg-teal/10 text-teal'
                  : 'text-foreground hover:bg-surface-light'
              }`}
            >
              Loop {i + 1}: {loop.title || 'Untitled'}
            </button>
            {activeTab === 'loops' && activeLoopIndex === i && (
              <ul className="ml-4 space-y-0.5">
                {loop.targets?.map((target, j) => (
                  <SidebarItem
                    key={target.id}
                    label={`${i + 1}.${j + 1}: ${target.title || 'Untitled'}`}
                    onClick={() => onNavigate('loops', i)}
                    small
                  />
                ))}
              </ul>
            )}
          </li>
        ))}

        {/* Wrap-up section */}
        <li className="pt-2">
          <span className="block px-3 py-1 text-sm font-semibold text-muted uppercase tracking-wide">
            Wrap-Up
          </span>
        </li>
        <SidebarItem
          label="Model Progression"
          active={activeTab === 'wrapup'}
          onClick={() => onNavigate('wrapup')}
        />
        <SidebarItem
          label="Transfer Task"
          active={activeTab === 'wrapup'}
          onClick={() => onNavigate('wrapup')}
        />
      </ul>
    </nav>
  );
}

function SidebarItem({
  label,
  onClick,
  small,
  muted,
  active,
}: {
  label: string;
  onClick: () => void;
  small?: boolean;
  muted?: boolean;
  active?: boolean;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded transition-colors truncate ${
          small ? 'text-sm' : 'text-base'
        } ${active ? 'text-teal font-medium' : muted ? 'text-muted' : 'text-foreground'} hover:bg-surface-light`}
      >
        {label}
      </button>
    </li>
  );
}
