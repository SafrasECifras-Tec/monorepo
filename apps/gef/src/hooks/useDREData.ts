import { useImportedData, SafraImportData } from '@/contexts/ImportDataContext';

export function useDREData(): Record<string, SafraImportData> | null {
  const { data } = useImportedData();
  if (!data.dre) return null;
  return Object.fromEntries(data.dre.safras.map(s => [s.safra, s]));
}

export function useDRESafras(): string[] | null {
  const { data } = useImportedData();
  if (!data.dre) return null;
  return data.dre.safras.map(s => s.safra);
}
