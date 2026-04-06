import type { Unit } from './types';

const STORAGE_KEY = 'ngss-units';

function readStore(): Record<string, Unit> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Unit>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getUnits(): Unit[] {
  const store = readStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getUnit(id: string): Unit | null {
  const store = readStore();
  return store[id] ?? null;
}

export function saveUnit(unit: Unit): void {
  const store = readStore();
  store[unit.id] = { ...unit, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function deleteUnit(id: string): void {
  const store = readStore();
  delete store[id];
  writeStore(store);
}

export function exportAsJson(): string {
  return JSON.stringify(readStore(), null, 2);
}

export function importFromJson(json: string): number {
  const imported: Record<string, Unit> = JSON.parse(json);
  const store = readStore();
  let count = 0;
  for (const [id, unit] of Object.entries(imported)) {
    store[id] = unit;
    count++;
  }
  writeStore(store);
  return count;
}
