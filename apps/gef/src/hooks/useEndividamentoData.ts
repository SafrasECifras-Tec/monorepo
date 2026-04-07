import { useImportedData, ParcelaRow } from '@/contexts/ImportDataContext';

export interface EndividamentoData {
  parcelas: ParcelaRow[];
}

export function useEndividamentoData(): EndividamentoData | null {
  const { data } = useImportedData();
  return data.endividamento ?? null;
}
