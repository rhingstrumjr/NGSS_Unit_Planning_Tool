'use client';

import { useState } from 'react';
import type { Unit, Loop } from '@/lib/types';
import { createBlankLoop, createBlankStandard } from '@/lib/defaults';
import { buildMarkdownV2 } from '@/lib/parser/markdown-builder';
import { Tabs } from '@/components/ui/Tabs';
import { ExportGoogleDocButton } from './ExportGoogleDocButton';
import { OutlineSidebar } from './OutlineSidebar';
import { NotesPanel } from './NotesPanel';
import { PhenomenonCard } from './PhenomenonCard';
import { DrivingQuestionsCard } from './DrivingQuestionsCard';
import { ModelProgressionCard } from './ModelProgressionCard';
import { LoopCard } from './LoopCard';
import { TransferTaskCard } from './TransferTaskCard';
import { PlanningTableView } from './PlanningTableView';
import { AddButton } from '@/components/ui/AddButton';
import { AiSuggestButton } from '@/components/ui/AiSuggestButton';

interface UnitEditorProps {
  unit: Unit;
  updateUnit: (updater: (prev: Unit) => Unit) => void;
}

type MainTab = 'overview' | 'loops' | 'wrapup' | 'planning';

export function UnitEditor({ unit, updateUnit }: UnitEditorProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [activeLoopIndex, setActiveLoopIndex] = useState(0);

  function updateLoop(loopId: string, updated: Loop) {
    updateUnit((prev) => ({
      ...prev,
      loops: prev.loops.map((l) => (l.id === loopId ? updated : l)),
    }));
  }

  function addLoop() {
    updateUnit((prev) => ({
      ...prev,
      loops: [...prev.loops, createBlankLoop(prev.loops.length)],
    }));
    setActiveLoopIndex(unit.loops.length);
  }

  function removeLoop(loopId: string) {
    if (!confirm('Remove this loop and all its targets?')) return;
    updateUnit((prev) => ({
      ...prev,
      loops: prev.loops
        .filter((l) => l.id !== loopId)
        .map((l, i) => ({ ...l, sortOrder: i })),
    }));
    setActiveLoopIndex((prev) => Math.max(0, prev - 1));
  }

  function moveTargetToLoop(targetId: string, srcLoopId: string, destLoopId: string) {
    updateUnit((prev) => {
      const srcLoop = prev.loops.find((l) => l.id === srcLoopId);
      const destLoop = prev.loops.find((l) => l.id === destLoopId);
      if (!srcLoop || !destLoop) return prev;
      const target = srcLoop.targets.find((t) => t.id === targetId);
      if (!target) return prev;
      return {
        ...prev,
        loops: prev.loops.map((l) => {
          if (l.id === srcLoopId) {
            return {
              ...l,
              targets: l.targets
                .filter((t) => t.id !== targetId)
                .map((t, i) => ({ ...t, sortOrder: i })),
            };
          }
          if (l.id === destLoopId) {
            return {
              ...l,
              targets: [
                ...l.targets,
                { ...target, sortOrder: l.targets.length },
              ],
            };
          }
          return l;
        }),
      };
    });
  }

  function moveTargetWithinLoop(loopId: string, targetId: string, direction: 'up' | 'down') {
    updateUnit((prev) => ({
      ...prev,
      loops: prev.loops.map((l) => {
        if (l.id !== loopId) return l;
        const idx = l.targets.findIndex((t) => t.id === targetId);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= l.targets.length) return l;
        const newTargets = [...l.targets];
        [newTargets[idx], newTargets[swapIdx]] = [newTargets[swapIdx], newTargets[idx]];
        return { ...l, targets: newTargets.map((t, i) => ({ ...t, sortOrder: i })) };
      }),
    }));
  }

  function addStandard() {
    updateUnit((prev) => ({
      ...prev,
      standards: [...prev.standards, createBlankStandard()],
    }));
  }

  function removeStandard(id: string) {
    updateUnit((prev) => ({
      ...prev,
      standards: prev.standards.filter((s) => s.id !== id),
    }));
  }

  function handleNavigate(tab: MainTab, loopIndex?: number) {
    setActiveTab(tab);
    if (loopIndex !== undefined) setActiveLoopIndex(loopIndex);
  }

  const mainTabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'loops' as const, label: 'Sensemaking Loops', badge: String(unit.loops.length) },
    { id: 'wrapup' as const, label: 'Wrap-Up' },
    { id: 'planning' as const, label: 'Planning Table' },
  ];

  const loopTabs = unit.loops.map((loop, i) => ({
    id: String(i),
    label: `Loop ${i + 1}${loop.title ? ': ' + loop.title : ''}`,
  }));

  const currentLoop = unit.loops[activeLoopIndex];

  return (
    <div className="flex h-[calc(100vh-53px)]">
      {/* Left sidebar — outline */}
      <OutlineSidebar
        unit={unit}
        activeTab={activeTab}
        activeLoopIndex={activeLoopIndex}
        onNavigate={handleNavigate}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top tab bar */}
        <div className="flex-shrink-0 bg-surface px-6 pt-2">
          <Tabs
            tabs={mainTabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as MainTab)}
          />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === 'overview' && (
            <>
              {/* Unit header */}
              <div className="mb-6">
                <input
                  type="text"
                  value={unit.title}
                  onChange={(e) =>
                    updateUnit((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Unit Title"
                  className="w-full bg-transparent text-3xl font-bold focus:outline-none border-b border-transparent hover:border-border focus:border-teal pb-1 transition-colors"
                />
                <div className="flex gap-3 mt-3 items-end">
                  <div>
                    <label className="block text-sm text-muted mb-1">Grade Band</label>
                    <select
                      value={unit.gradeBand}
                      onChange={(e) =>
                        updateUnit((prev) => ({ ...prev, gradeBand: e.target.value }))
                      }
                      className="bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal"
                    >
                      <option value="">Select...</option>
                      <option value="K-2">K-2</option>
                      <option value="3-5">3-5</option>
                      <option value="MS">MS (6-8)</option>
                      <option value="HS">HS (9-12)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">Course</label>
                    <input
                      type="text"
                      value={unit.course}
                      onChange={(e) =>
                        updateUnit((prev) => ({ ...prev, course: e.target.value }))
                      }
                      placeholder="e.g., Chemistry"
                      className="bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">Est. Days</label>
                    <input
                      type="number"
                      value={unit.estimatedDays || ''}
                      onChange={(e) =>
                        updateUnit((prev) => ({
                          ...prev,
                          estimatedDays: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-20 bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal"
                    />
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => {
                        const md = buildMarkdownV2(unit);
                        const blob = new Blob([md], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${unit.title || 'unit'}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground hover:border-teal/40 transition-colors"
                    >
                      Export Markdown
                    </button>
                    <ExportGoogleDocButton
                      unit={unit}
                      onDocCreated={(docUrl) =>
                        updateUnit((prev) => ({ ...prev, googleDocUrl: docUrl }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Standards */}
              <div className="mb-4 bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted">Standards</label>
                </div>
                <div className="space-y-2">
                  {unit.standards.map((std) => (
                    <div key={std.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={std.code}
                        onChange={(e) =>
                          updateUnit((prev) => ({
                            ...prev,
                            standards: prev.standards.map((s) =>
                              s.id === std.id ? { ...s, code: e.target.value } : s
                            ),
                          }))
                        }
                        placeholder="PE code"
                        className="w-28 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
                      />
                      <input
                        type="text"
                        value={std.description}
                        onChange={(e) =>
                          updateUnit((prev) => ({
                            ...prev,
                            standards: prev.standards.map((s) =>
                              s.id === std.id
                                ? { ...s, description: e.target.value }
                                : s
                            ),
                          }))
                        }
                        placeholder="Description"
                        className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal"
                      />
                      <button
                        onClick={() => removeStandard(std.id)}
                        className="text-muted hover:text-red text-sm"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-1">
                  <AddButton label="Add Standard" onClick={addStandard} />
                </div>
              </div>

              {/* Gapless Explanation */}
              <div className="mb-4 bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-muted">
                    Gapless Explanation (teacher-only)
                  </label>
                  <AiSuggestButton
                    context={{
                      fieldType: 'gapless-explanation',
                      phenomenonName: unit.phenomena.find((p) => p.isPrimary)?.name ?? unit.phenomena[0]?.name,
                      phenomenonDescription: unit.phenomena.find((p) => p.isPrimary)?.description ?? unit.phenomena[0]?.description,
                      unitDrivingQuestion: unit.unitDrivingQuestion,
                    }}
                    onAccept={(text) =>
                      updateUnit((prev) => ({ ...prev, gaplessExplanation: text }))
                    }
                  />
                </div>
                <textarea
                  value={unit.gaplessExplanation}
                  onChange={(e) =>
                    updateUnit((prev) => ({
                      ...prev,
                      gaplessExplanation: e.target.value,
                    }))
                  }
                  placeholder="The complete causal explanation of the phenomenon that students will build toward..."
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
                  rows={4}
                />
              </div>

              {/* Phenomenon */}
              <PhenomenonCard unit={unit} updateUnit={updateUnit} />

              {/* Driving Questions */}
              <DrivingQuestionsCard unit={unit} updateUnit={updateUnit} />
            </>
          )}

          {/* ─── SENSEMAKING LOOPS TAB ─── */}
          {activeTab === 'loops' && (
            <>
              {/* Loop sub-tabs */}
              <div className="mb-4">
                <Tabs
                  tabs={loopTabs}
                  activeTab={String(activeLoopIndex)}
                  onChange={(id) => setActiveLoopIndex(Number(id))}
                  trailing={
                    <button
                      onClick={addLoop}
                      className="px-3 py-1.5 text-sm text-teal hover:text-teal-light transition-colors"
                    >
                      + Add Loop
                    </button>
                  }
                />
              </div>

              {/* Active loop content */}
              {currentLoop ? (
                <LoopCard
                  key={currentLoop.id}
                  loop={currentLoop}
                  loopIndex={activeLoopIndex}
                  unit={unit}
                  onChange={(updated) => updateLoop(currentLoop.id, updated)}
                  onRemove={() => removeLoop(currentLoop.id)}
                  onMoveTargetTo={(targetId, destLoopId) => moveTargetToLoop(targetId, currentLoop.id, destLoopId)}
                  onMoveTargetUpDown={(targetId, dir) => moveTargetWithinLoop(currentLoop.id, targetId, dir)}
                  otherLoops={unit.loops.filter((l) => l.id !== currentLoop.id)}
                  expanded
                />
              ) : (
                <div className="text-center py-12 text-muted">
                  <p className="text-lg mb-3">No sensemaking loops yet</p>
                  <AddButton label="Add Sensemaking Loop" onClick={addLoop} />
                </div>
              )}
            </>
          )}

          {/* ─── WRAP-UP TAB ─── */}
          {activeTab === 'wrapup' && (
            <>
              <ModelProgressionCard unit={unit} updateUnit={updateUnit} />
              <TransferTaskCard unit={unit} updateUnit={updateUnit} />
            </>
          )}

          {/* ─── PLANNING TABLE TAB ─── */}
          {activeTab === 'planning' && (
            <PlanningTableView unit={unit} updateUnit={updateUnit} />
          )}
        </div>
      </div>

      {/* Right panel — teacher notes */}
      <NotesPanel unit={unit} updateUnit={updateUnit} />
    </div>
  );
}
