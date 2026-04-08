import React from 'react';
import { FileSpreadsheet, Upload, Loader2 } from 'lucide-react';

interface EmptyDataStateProps {
  module: string;
  description?: string;
  onImport: () => void;
  isLoading?: boolean;
}

export function EmptyDataState({
  module,
  description,
  onImport,
  isLoading = false,
}: EmptyDataStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 gap-6">
      <div className="p-5 bg-slate-100 rounded-2xl">
        <FileSpreadsheet className="h-10 w-10 text-slate-400" />
      </div>

      <div className="text-center max-w-sm">
        <h3 className="text-lg font-bold text-slate-700">
          Nenhum dado importado
        </h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          {description ?? `Importe uma planilha para visualizar os dados de ${module}.`}
        </p>
      </div>

      <button
        onClick={onImport}
        disabled={isLoading}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Upload className="h-4 w-4" />
        }
        Importar planilha (.xlsx)
      </button>

      <p className="text-xs text-slate-400">
        Acesse <strong>Ajustes</strong> para baixar o modelo ou remover dados importados
      </p>
    </div>
  );
}
