'use client';

import { useState } from 'react';
import type { Target } from '@/lib/types';
import { SummaryTableCard } from './SummaryTableCard';
import { ActivityList } from './ActivityCard';
import { FormativeCard } from './FormativeCard';
import { ResourceList } from './ResourceList';
import { ResourceResearchDrawer } from './ResourceResearchDrawer';
import { AiSuggestButton } from '@/components/ui/AiSuggestButton';

interface TargetCardProps {
  target: Target;
  loopIndex: number;
  targetIndex: number;
  onChange: (target: Target) => void;
  onRemove: () => void;
  /** Passed from the parent loop/unit for AI context */
  phenomenonName?: string;
  loopTitle?: string;
  gradeBand?: string;
}

export function TargetCard({
  target,
  loopIndex,
  targetIndex,
  onChange,
  onRemove,
  phenomenonName,
  loopTitle,
  gradeBand,
}: TargetCardProps) {
  const [open, setOpen] = useState(false);
  const label = `${loopIndex + 1}.${targetIndex + 1}`;

  return (
    <div
      className="border border-border border-l-4 border-l-amber rounded-lg mb-3 bg-surface/50"
      data-section-id={`target-${target.id}`}
    >
      {/* Target header */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-light/20 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-amber font-mono text-base font-semibold flex-shrink-0">
          {label}
        </span>
        <span className="text-base flex-1 truncate">
          {target.title || 'Untitled Target'}
        </span>
        <svg
          className={`w-3 h-3 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-muted mb-1">
              Learning Target
            </label>
            <input
              type="text"
              value={target.title}
              onChange={(e) => onChange({ ...target, title: e.target.value })}
              placeholder="I can... / Students will figure out..."
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
            />
          </div>

          {/* 3D Alignment */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-muted mb-1">DCI</label>
              <input
                type="text"
                value={target.dciAlignment}
                onChange={(e) =>
                  onChange({ ...target, dciAlignment: e.target.value })
                }
                placeholder="e.g., PS1.B"
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">SEP</label>
              <input
                type="text"
                value={target.sepAlignment}
                onChange={(e) =>
                  onChange({ ...target, sepAlignment: e.target.value })
                }
                placeholder="e.g., Developing Models"
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">CCC</label>
              <input
                type="text"
                value={target.cccAlignment}
                onChange={(e) =>
                  onChange({ ...target, cccAlignment: e.target.value })
                }
                placeholder="e.g., Energy & Matter"
                className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          {/* Model Contribution */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-muted">Model Contribution</label>
              <AiSuggestButton
                context={{
                  fieldType: 'model-contribution',
                  phenomenonName,
                  loopTitle,
                  loopIndex,
                  targetTitle: target.title,
                  dciAlignment: target.dciAlignment,
                  sepAlignment: target.sepAlignment,
                  cccAlignment: target.cccAlignment,
                }}
                onAccept={(text) => onChange({ ...target, modelContribution: text })}
              />
            </div>
            <textarea
              value={target.modelContribution}
              onChange={(e) =>
                onChange({ ...target, modelContribution: e.target.value })
              }
              placeholder="What do students add or revise in their model?"
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
              rows={2}
            />
          </div>

          {/* Summary Table */}
          <SummaryTableCard
            summaryTable={target.summaryTable}
            onChange={(summaryTable) => onChange({ ...target, summaryTable })}
            aiContext={{
              phenomenonName,
              loopTitle,
              loopIndex,
              targetTitle: target.title,
              dciAlignment: target.dciAlignment,
              sepAlignment: target.sepAlignment,
              cccAlignment: target.cccAlignment,
            }}
          />

          {/* Activities */}
          <ActivityList
            activities={target.activities}
            onChange={(activities) => onChange({ ...target, activities })}
            aiContext={{
              phenomenonName,
              loopTitle,
              loopIndex,
              targetTitle: target.title,
              dciAlignment: target.dciAlignment,
              sepAlignment: target.sepAlignment,
              cccAlignment: target.cccAlignment,
            }}
          />

          {/* Formative */}
          <FormativeCard
            formative={target.formative}
            onChange={(formative) => onChange({ ...target, formative })}
            aiContext={{
              phenomenonName,
              loopTitle,
              loopIndex,
              targetTitle: target.title,
              dciAlignment: target.dciAlignment,
              sepAlignment: target.sepAlignment,
              cccAlignment: target.cccAlignment,
            }}
          />

          {/* Resources */}
          <ResourceResearchDrawer
            tier="target"
            context={{
              tier: 'target',
              gradeBand: gradeBand ?? '',
              phenomenonName: phenomenonName ?? '',
              loopTitle: loopTitle ?? '',
              targetTitle: target.title,
              dciAlignment: target.dciAlignment,
              sepAlignment: target.sepAlignment,
              cccAlignment: target.cccAlignment,
            }}
            onAddResource={(r) => onChange({ ...target, resources: [...target.resources, r] })}
            onAddActivity={(a) => onChange({ ...target, activities: [...target.activities, a] })}
          />
          <ResourceList
            resources={target.resources}
            onChange={(resources) => onChange({ ...target, resources })}
          />

          {/* Remove */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={onRemove}
              className="text-sm text-muted hover:text-red"
            >
              Remove Target
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
