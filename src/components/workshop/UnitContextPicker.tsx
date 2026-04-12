'use client';

import { useEffect, useState } from 'react';
import type { Unit, Loop, Target } from '@/lib/types';
import type { UnitContext } from '@/lib/ai/worksheet-enhancer';
import { getUnits } from '@/lib/storage';

interface UnitContextPickerProps {
  value: UnitContext | undefined;
  onChange: (ctx: UnitContext | undefined) => void;
}

export function UnitContextPicker({ value, onChange }: UnitContextPickerProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedLoopIdx, setSelectedLoopIdx] = useState<string>('');
  const [selectedTargetIdx, setSelectedTargetIdx] = useState<string>('');
  const [expanded, setExpanded] = useState(!!value);

  useEffect(() => {
    setUnits(getUnits());
  }, []);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const selectedLoop: Loop | undefined =
    selectedUnit && selectedLoopIdx !== ''
      ? selectedUnit.loops[Number(selectedLoopIdx)]
      : undefined;
  const selectedTarget: Target | undefined =
    selectedLoop && selectedTargetIdx !== ''
      ? selectedLoop.targets[Number(selectedTargetIdx)]
      : undefined;

  function buildContext(
    unit: Unit | undefined,
    loop: Loop | undefined,
    target: Target | undefined
  ): UnitContext | undefined {
    if (!unit) return undefined;
    const primary = unit.phenomena.find((p) => p.isPrimary) ?? unit.phenomena[0];
    return {
      phenomenonName: primary?.name ?? '',
      phenomenonDescription: primary?.description ?? '',
      unitDrivingQuestion: unit.unitDrivingQuestion,
      gradeBand: unit.gradeBand,
      standards: unit.standards.map((s) => ({
        code: s.code,
        description: s.description,
        type: s.type,
      })),
      loopTitle: loop?.title,
      phenomenonConnection: loop?.phenomenonConnection,
      targetTitle: target?.title,
      dciAlignment: target?.dciAlignment,
      sepAlignment: target?.sepAlignment,
      cccAlignment: target?.cccAlignment,
    };
  }

  function handleUnitChange(unitId: string) {
    setSelectedUnitId(unitId);
    setSelectedLoopIdx('');
    setSelectedTargetIdx('');
    const unit = units.find((u) => u.id === unitId);
    onChange(buildContext(unit, undefined, undefined));
  }

  function handleLoopChange(loopIdx: string) {
    setSelectedLoopIdx(loopIdx);
    setSelectedTargetIdx('');
    const loop = loopIdx !== '' ? selectedUnit?.loops[Number(loopIdx)] : undefined;
    onChange(buildContext(selectedUnit, loop, undefined));
  }

  function handleTargetChange(targetIdx: string) {
    setSelectedTargetIdx(targetIdx);
    const target = targetIdx !== '' && selectedLoop ? selectedLoop.targets[Number(targetIdx)] : undefined;
    onChange(buildContext(selectedUnit, selectedLoop, target));
  }

  function handleClear() {
    setSelectedUnitId('');
    setSelectedLoopIdx('');
    setSelectedTargetIdx('');
    onChange(undefined);
  }

  if (units.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-teal hover:underline flex items-center gap-1"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9654;</span>
        Link to Unit Context (optional)
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-surface-light rounded-lg border border-border space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={selectedUnitId}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="flex-1 text-sm rounded border border-border bg-surface px-2 py-1.5"
            >
              <option value="">Select a unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title || 'Untitled Unit'}
                </option>
              ))}
            </select>
            {selectedUnitId && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {selectedUnit && selectedUnit.loops.length > 0 && (
            <select
              value={selectedLoopIdx}
              onChange={(e) => handleLoopChange(e.target.value)}
              className="w-full text-sm rounded border border-border bg-surface px-2 py-1.5"
            >
              <option value="">All loops (unit-level context)</option>
              {selectedUnit.loops.map((loop, i) => (
                <option key={loop.id} value={String(i)}>
                  Loop {i + 1}: {loop.title || 'Untitled'}
                </option>
              ))}
            </select>
          )}

          {selectedLoop && selectedLoop.targets.length > 0 && (
            <select
              value={selectedTargetIdx}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="w-full text-sm rounded border border-border bg-surface px-2 py-1.5"
            >
              <option value="">All targets in this loop</option>
              {selectedLoop.targets.map((target, i) => (
                <option key={target.id} value={String(i)}>
                  Target {i + 1}: {target.title || 'Untitled'}
                </option>
              ))}
            </select>
          )}

          {value && (
            <p className="text-xs text-muted mt-1">
              Context: {value.phenomenonName ? `"${value.phenomenonName}"` : 'Unit selected'}
              {value.loopTitle ? ` > ${value.loopTitle}` : ''}
              {value.targetTitle ? ` > ${value.targetTitle}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
