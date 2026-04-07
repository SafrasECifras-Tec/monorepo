import { useImportedData, TransactionRow } from '@/contexts/ImportDataContext';

export function useFluxoCaixaData(): TransactionRow[] | null {
  const { data } = useImportedData();
  return data.fluxoCaixa?.transactions ?? null;
}
