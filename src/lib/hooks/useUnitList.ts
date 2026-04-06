'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Unit } from '../types';
import { getUnits, deleteUnit as removeUnit, importFromJson, exportAsJson } from '../storage';

export function useUnitList() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setUnits(getUnits());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  const deleteUnit = useCallback(
    (id: string) => {
      removeUnit(id);
      refresh();
    },
    [refresh]
  );

  const importJson = useCallback(
    (json: string) => {
      const count = importFromJson(json);
      refresh();
      return count;
    },
    [refresh]
  );

  const exportJson = useCallback(() => {
    return exportAsJson();
  }, []);

  return { units, loading, deleteUnit, importJson, exportJson, refresh };
}
