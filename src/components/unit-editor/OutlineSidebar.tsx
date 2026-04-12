'use client';

import type { Unit } from '@/lib/types';
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

type MainTab = 'overview' | 'loops' | 'wrapup' | 'planning';

interface OutlineSidebarProps {
  unit: Unit;
  activeTab: MainTab;
  activeLoopIndex: number;
  onNavigate: (tab: MainTab, loopIndex?: number) => void;
  updateUnit?: (updater: (prev: Unit) => Unit) => void;
}

export function OutlineSidebar({
  unit,
  activeTab,
  activeLoopIndex,
  onNavigate,
  updateUnit,
}: OutlineSidebarProps) {
  const primary = unit.phenomena?.find((p) => p.isPrimary);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleLoopDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !updateUnit) return;

    const oldIndex = unit.loops.findIndex((l) => l.id === active.id);
    const newIndex = unit.loops.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(unit.loops, oldIndex, newIndex).map((l, i) => ({
      ...l,
      sortOrder: i,
    }));

    updateUnit((prev) => ({ ...prev, loops: reordered }));

    // If the active loop moved, follow it to its new position
    if (activeLoopIndex === oldIndex) {
      onNavigate('loops', newIndex);
    } else if (activeLoopIndex > oldIndex && activeLoopIndex <= newIndex) {
      onNavigate('loops', activeLoopIndex - 1);
    } else if (activeLoopIndex < oldIndex && activeLoopIndex >= newIndex) {
      onNavigate('loops', activeLoopIndex + 1);
    }
  }

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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleLoopDragEnd}
        >
          <SortableContext
            items={unit.loops.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {unit.loops?.map((loop, i) => (
              <SortableLoopItem
                key={loop.id}
                loop={loop}
                index={i}
                activeTab={activeTab}
                activeLoopIndex={activeLoopIndex}
                onNavigate={onNavigate}
                targets={loop.targets}
              />
            ))}
          </SortableContext>
        </DndContext>

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

function SortableLoopItem({
  loop,
  index,
  activeTab,
  activeLoopIndex,
  onNavigate,
  targets,
}: {
  loop: Unit['loops'][number];
  index: number;
  activeTab: MainTab;
  activeLoopIndex: number;
  onNavigate: (tab: MainTab, loopIndex?: number) => void;
  targets: Unit['loops'][number]['targets'];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: loop.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = activeTab === 'loops' && activeLoopIndex === index;

  return (
    <li ref={setNodeRef} style={style}>
      <div className={`flex items-center gap-1 rounded ${isActive ? 'bg-teal/10' : ''}`}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 px-1.5 py-2 text-muted/40 hover:text-muted cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </button>
        {/* Loop label */}
        <button
          onClick={() => onNavigate('loops', index)}
          className={`flex-1 text-left py-2 pr-3 rounded transition-colors font-medium truncate text-base ${
            isActive ? 'text-teal' : 'text-foreground hover:text-teal/80'
          }`}
        >
          Loop {index + 1}: {loop.title || 'Untitled'}
        </button>
      </div>
      {isActive && targets?.length > 0 && (
        <ul className="ml-7 space-y-0.5">
          {targets.map((target, j) => (
            <SidebarItem
              key={target.id}
              label={`${index + 1}.${j + 1}: ${target.title || 'Untitled'}`}
              onClick={() => onNavigate('loops', index)}
              small
            />
          ))}
        </ul>
      )}
    </li>
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
