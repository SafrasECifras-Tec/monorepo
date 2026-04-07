import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { XlsxParseError } from '@/lib/xlsx/parseError';
import { parseUniversal, getModuleLabel } from '@/lib/xlsx/parseUniversal';
import { useImportedData } from '@/contexts/ImportDataContext';
import type { ImportedDataStore } from '@/contexts/ImportDataContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Hook de importação universal.
 * @param confirmOverwrite - Callback assíncrono para confirmação de sobrescrita.
 *   Recebe os rótulos dos módulos afetados e deve retornar true para prosseguir.
 *   Se omitido, usa window.confirm como fallback.
 */
export function useUniversalImport(
  confirmOverwrite?: (moduleLabels: string[]) => Promise<boolean>,
) {
  const { data, bulkSetData } = useImportedData();
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    // ── Validações básicas ────────────────────────────────────────────────────
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Apenas arquivos .xlsx são suportados.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo permitido: 10MB.');
      return;
    }

    setIsLoading(true);

    try {
      // ── Leitura e parse ───────────────────────────────────────────────────
      const buffer = await file.arrayBuffer();
      const wb     = XLSX.read(buffer, { type: 'array' });
      const result = parseUniversal(wb);

      if (result.modulesFound.length === 0) {
        toast.error(
          'Nenhuma aba reconhecida encontrada. Verifique se está usando o modelo correto.',
          { description: 'Abas esperadas: Transações, Parcelas, Ativo, Passivo, DRE, Estoque' }
        );
        return;
      }

      // ── Confirmação de sobrescrita ────────────────────────────────────────
      const toOverwrite = result.modulesFound.filter(
        (key) => data[key as keyof ImportedDataStore] !== null,
      ) as (keyof ImportedDataStore)[];

      if (toOverwrite.length > 0) {
        const labels = toOverwrite.map(getModuleLabel);
        const confirmed = confirmOverwrite
          ? await confirmOverwrite(labels)
          : window.confirm(
              `Os dados de "${labels.join(', ')}" serão substituídos.\n\nDeseja continuar?`
            );
        if (!confirmed) {
          toast.info('Importação cancelada.');
          return;
        }
      }

      // ── Salva no contexto (IndexedDB) ─────────────────────────────────────
      await bulkSetData(result.data);

      // ── Avisos de linhas inválidas ────────────────────────────────────────
      result.warnings.forEach(w => toast.warning(w));

      // ── Resumo do sucesso ─────────────────────────────────────────────────
      const importedLabels = result.modulesFound.map(getModuleLabel).join(', ');
      toast.success('Importação concluída!', {
        description: `Módulos atualizados: ${importedLabels}`,
      });
    } catch (err) {
      if (err instanceof XlsxParseError) {
        toast.error(err.message);
      } else {
        toast.error('Arquivo inválido ou corrompido. Tente salvar novamente no Excel.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [data, bulkSetData, confirmOverwrite]);

  const openFilePicker = useCallback(() => {
    const input = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) processFile(file);
    };
    input.click();
  }, [processFile]);

  return { isLoading, openFilePicker, processFile };
}
