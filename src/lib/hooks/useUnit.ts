'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Unit } from '../types';
import { getUnit, saveUnit } from '../storage';

export function useUnit(id: string) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on mount
  useEffect(() => {
    const loaded = getUnit(id);
    setUnit(loaded);
    setLoading(false);
  }, [id]);

  // Auto-save (debounced 500ms)
  const updateUnit = useCallback(
    (updater: (prev: Unit) => Unit) => {
      setUnit((prev) => {
        if (!prev) return prev;
        const next = updater(prev);

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          saveUnit(next);
        }, 500);

        return next;
      });
    },
    []
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Force immediate save
  const saveNow = useCallback(() => {
    if (unit) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveUnit(unit);
    }
  }, [unit]);

  return { unit, loading, updateUnit, saveNow };
}
