import { useImportedData, CropStockImport } from '@/contexts/ImportDataContext';

export function useEstoqueData(): CropStockImport[] | null {
  const { data } = useImportedData();
  return data.estoque?.crops ?? null;
}
