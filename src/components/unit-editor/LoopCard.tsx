'use client';

import type { Unit, Loop, Target, Resource } from '@/lib/types';
import { createBlankTarget } from '@/lib/defaults';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { AddButton } from '@/components/ui/AddButton';
import { AiSuggestButton } from '@/components/ui/AiSuggestButton';
import { ResourceList } from './ResourceList';
import { ResourceResearchDrawer } from './ResourceResearchDrawer';
import { TargetCard } from './TargetCard';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LoopCardProps {
  loop: Loop;
  loopIndex: number;
  unit: Unit;
  onChange: (loop: Loop) => void;
  onRemove: () => void;
  onMoveTargetTo?: (targetId: string, destLoopId: string) => void;
  onMoveTargetUpDown?: (targetId: string, direction: 'up' | 'down') => void;
  otherLoops?: { id: string; title: string; sortOrder: number }[];
  /** When true, renders fully expanded without the CollapsibleCard wrapper */
  expanded?: boolean;
}

export function LoopCard({
  loop,
  loopIndex,
  unit,
  onChange,
  onRemove,
  onMoveTargetTo,
  onMoveTargetUpDown,
  otherLoops,
  expanded,
}: LoopCardProps) {
  function updateTarget(targetId: string, updated: Target) {
    onChange({
      ...loop,
      targets: loop.targets.map((t) => (t.id === targetId ? updated : t)),
    });
  }

  function addTarget() {
    onChange({
      ...loop,
      targets: [...loop.targets, createBlankTarget(loop.targets.length)],
    });
  }

  function removeTarget(targetId: string) {
    onChange({
      ...loop,
      targets: loop.targets
        .filter((t) => t.id !== targetId)
        .map((t, i) => ({ ...t, sortOrder: i })),
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleTargetDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = loop.targets.findIndex((t) => t.id === active.id);
    const newIndex = loop.targets.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange({
      ...loop,
      targets: arrayMove(loop.targets, oldIndex, newIndex).map((t, i) => ({
        ...t,
        sortOrder: i,
      })),
    });
  }

  const content = (
      <div className="space-y-4">
        {/* Loop metadata */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-muted mb-1">Title</label>
            <input
              type="text"
              value={loop.title}
              onChange={(e) => onChange({ ...loop, title: e.target.value })}
              placeholder="Loop title"
              className="w-full bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">
              Driving Question #
            </label>
            <select
              value={loop.dqId ?? ''}
              onChange={(e) =>
                onChange({ ...loop, dqId: e.target.value || null })
              }
              className="w-full bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal"
            >
              <option value="">Select...</option>
              {unit.drivingQuestions.map((dq, i) => (
                <option key={dq.id} value={dq.id}>
                  #{i + 1}: {dq.text?.slice(0, 40) || 'Untitled'}
                  {dq.text && dq.text.length > 40 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">
              Duration (days)
            </label>
            <input
              type="number"
              value={loop.durationDays || ''}
              onChange={(e) =>
                onChange({
                  ...loop,
                  durationDays: parseInt(e.target.value) || 0,
                })
              }
              className="w-full bg-surface border border-border rounded px-3 py-2 text-base focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        {/* Phenomenon Connection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-muted">Phenomenon Connection</label>
            <AiSuggestButton
              context={{
                fieldType: 'phenomenon-connection',
                phenomenonName: unit.phenomena.find((p) => p.isPrimary)?.name,
                unitDrivingQuestion: unit.unitDrivingQuestion,
                loopTitle: loop.title,
                loopIndex,
              }}
              onAccept={(text) => onChange({ ...loop, phenomenonConnection: text })}
            />
          </div>
          <textarea
            value={loop.phenomenonConnection}
            onChange={(e) =>
              onChange({ ...loop, phenomenonConnection: e.target.value })
            }
            placeholder="How does this loop connect back to the anchoring phenomenon?"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
            rows={2}
          />
        </div>

        {/* Investigative Phenomenon */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-muted">Investigative Phenomenon (optional)</label>
            <AiSuggestButton
              context={{
                fieldType: 'investigative-phenomenon',
                phenomenonName: unit.phenomena.find((p) => p.isPrimary)?.name,
                loopTitle: loop.title,
                loopIndex,
              }}
              onAccept={(text) => onChange({ ...loop, investigativePhenomenon: text })}
            />
          </div>
          <input
            type="text"
            value={loop.investigativePhenomenon}
            onChange={(e) =>
              onChange({ ...loop, investigativePhenomenon: e.target.value })
            }
            placeholder="A smaller, specific phenomenon for this loop..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
          />
        </div>

        {/* Navigation Routine */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-muted">Navigation Routine</label>
            <AiSuggestButton
              context={{
                fieldType: 'navigation-routine',
                phenomenonName: unit.phenomena.find((p) => p.isPrimary)?.name,
                loopTitle: loop.title,
                loopIndex,
                prevLoopTitle: loopIndex > 0 ? unit.loops[loopIndex - 1]?.title : undefined,
              }}
              onAccept={(text) => onChange({ ...loop, navigationRoutine: text })}
            />
          </div>
          <textarea
            value={loop.navigationRoutine}
            onChange={(e) =>
              onChange({ ...loop, navigationRoutine: e.target.value })
            }
            placeholder="How do students connect this to what came before? How do they see the coherence?"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
            rows={2}
          />
        </div>

        {/* Slides URL */}
        <div>
          <label className="block text-sm text-muted mb-1">Slides URL</label>
          <input
            type="url"
            value={loop.slidesUrl}
            onChange={(e) => onChange({ ...loop, slidesUrl: e.target.value })}
            placeholder="https://docs.google.com/presentation/..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal"
          />
        </div>

        {/* Loop Resources */}
        <div>
          <ResourceResearchDrawer
            tier="loop"
            context={{
              tier: 'loop',
              gradeBand: unit.gradeBand,
              phenomenonName: unit.phenomena.find((p) => p.isPrimary)?.name ?? '',
              loopTitle: loop.title,
              targetTitles: loop.targets.map((t) => t.title),
              dciConcepts: loop.targets.map((t) => t.dciAlignment).filter(Boolean),
            }}
            onAddResource={(r: Resource) =>
              onChange({ ...loop, resources: [...(loop.resources ?? []), r] })
            }
          />
          <ResourceList
            resources={loop.resources ?? []}
            onChange={(resources) => onChange({ ...loop, resources })}
            label="Teacher Reference Materials"
            helpText="For your own preparation — not shared directly with students"
          />
        </div>

        {/* Learning Targets */}
        <div>
          <h4 className="text-base font-semibold mb-2 text-amber">
            Learning Targets
          </h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleTargetDragEnd}
          >
            <SortableContext
              items={loop.targets.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {loop.targets.map((target, j) => (
                <SortableTargetWrapper key={target.id} id={target.id}>
                  <TargetCard
                    target={target}
                    loopIndex={loopIndex}
                    targetIndex={j}
                    onChange={(updated) => updateTarget(target.id, updated)}
                    onRemove={() => removeTarget(target.id)}
                    onMoveUp={j > 0 && onMoveTargetUpDown ? () => onMoveTargetUpDown(target.id, 'up') : undefined}
                    onMoveDown={j < loop.targets.length - 1 && onMoveTargetUpDown ? () => onMoveTargetUpDown(target.id, 'down') : undefined}
                    onMoveTo={onMoveTargetTo ? (destLoopId) => onMoveTargetTo(target.id, destLoopId) : undefined}
                    otherLoops={otherLoops}
                    phenomenonName={unit.phenomena.find((p) => p.isPrimary)?.name}
                    loopTitle={loop.title}
                    gradeBand={unit.gradeBand}
                    unitId={unit.id}
                    loopId={loop.id}
                  />
                </SortableTargetWrapper>
              ))}
            </SortableContext>
          </DndContext>
          <AddButton label="Add Learning Target" onClick={addTarget} />
        </div>

        {/* Problematizing Routine */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-muted">Problematizing Routine</label>
            <AiSuggestButton
              context={{
                fieldType: 'problematizing-routine',
                phenomenonName: unit.phenomena.find((p) => p.isPrimary)?.name,
                loopTitle: loop.title,
                loopIndex,
                nextLoopTitle: unit.loops[loopIndex + 1]?.title,
              }}
              onAccept={(text) => onChange({ ...loop, problematizingRoutine: text })}
            />
          </div>
          <textarea
            value={loop.problematizingRoutine}
            onChange={(e) =>
              onChange({ ...loop, problematizingRoutine: e.target.value })
            }
            placeholder="What gap, contradiction, or limitation in students' current understanding surfaces the next question? How does this bridge to the next loop?"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-teal resize-none"
            rows={3}
          />
        </div>

        {/* Remove loop */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={onRemove}
            className="text-sm text-muted hover:text-red"
          >
            Remove Loop
          </button>
        </div>
      </div>
  );

  if (expanded) {
    return (
      <div data-section-id={`loop-${loop.id}`}>
        {content}
      </div>
    );
  }

  return (
    <CollapsibleCard
      title={`Loop ${loopIndex + 1}: ${loop.title || 'Untitled'}`}
      subtitle={`${loop.durationDays} days | ${loop.targets.length} target${loop.targets.length !== 1 ? 's' : ''}`}
      borderColor="border-l-teal"
      data-section-id={`loop-${loop.id}`}
      headerExtra={
        <span className="text-sm text-muted">
          {loop.dqId
            ? (() => { const idx = unit.drivingQuestions.findIndex((q) => q.id === loop.dqId); return idx >= 0 ? `DQ #${idx + 1}` : 'DQ ?'; })()
            : 'DQ ?'}
        </span>
      }
    >
      {content}
    </CollapsibleCard>
  );
}

/** Thin wrapper that makes a TargetCard sortable via drag handle. */
function SortableTargetWrapper({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="relative"
    >
      {/* Drag handle — sits above the card header on the left */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 h-full w-5 flex items-center justify-center text-muted/30 hover:text-muted cursor-grab active:cursor-grabbing touch-none z-10 rounded-l-lg"
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      <div className="pl-5">{children}</div>
    </div>
  );
}
