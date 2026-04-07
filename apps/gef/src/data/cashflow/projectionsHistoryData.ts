import type { CategoryData } from './realizedProjectedData';

export interface ProjectionSnapshot {
  id: string;
  label: string;
  notes: string;
  savedAt: string; // ISO string
  monthlyData: CategoryData[];
  annualData: CategoryData[];
  saldoOverridesMonthly: Record<number, number>;
  saldoOverridesAnnual: Record<number, number>;
}

const STORAGE_KEY = 'gef_cashflow_projections';

export function loadSnapshots(): ProjectionSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProjectionSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(
  snapshot: Omit<ProjectionSnapshot, 'id' | 'savedAt'>
): ProjectionSnapshot {
  const newSnapshot: ProjectionSnapshot = {
    ...snapshot,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  const existing = loadSnapshots();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newSnapshot, ...existing]));
  return newSnapshot;
}

export function deleteSnapshot(id: string): void {
  const updated = loadSnapshots().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
