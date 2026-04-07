import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { XlsxParseError } from '@/lib/xlsx/parseError';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useModuleImport<T>(
  parser: (wb: XLSX.WorkBook) => T,
  onSuccess: (data: T) => void,
) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Apenas arquivos .xlsx são suportados.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo permitido: 10MB.');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) throw new Error('Leitura falhou.');
        const wb = XLSX.read(buffer, { type: 'array' });
        const result = parser(wb) as T & { invalidCount?: number };

        if (result.invalidCount && result.invalidCount > 0) {
          toast.warning(`${result.invalidCount} linha(s) com valores inválidos foram ignoradas.`);
        }

        onSuccess(result);
        toast.success('Dados importados com sucesso!');
      } catch (err) {
        if (err instanceof XlsxParseError) {
          toast.error(err.message);
        } else {
          toast.error('Arquivo inválido ou corrompido. Tente salvar novamente no Excel.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo. Tente novamente.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, [parser, onSuccess]);

  const openFilePicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return { isLoading, openFilePicker };
}
