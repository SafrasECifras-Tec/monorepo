import { useImportedData, BalanceTableRow } from '@/contexts/ImportDataContext';

// Fallback para dados importados antes da versão com colunas dinâmicas
const DEFAULT_COLUMNS = ['2022/23', '2023/24', '1ª Avaliação', 'Visão Atual'];

export interface BalancoData {
  columns: string[];
  ativo: BalanceTableRow[];
  passivo: BalanceTableRow[];
}

export function useBalancoData(): BalancoData | null {
  const { data } = useImportedData();
  if (!data.balanco) return null;
  return {
    columns: data.balanco.columns ?? DEFAULT_COLUMNS,
    ativo:   data.balanco.ativo,
    passivo: data.balanco.passivo,
  };
}
