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
    <div className="data-panel animate-fade-in flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <FileSpreadsheet className="h-7 w-7 text-primary" />
      </div>

      <div className="text-center max-w-sm">
        <h3 className="text-xl font-bold text-foreground mb-2">
          Nenhum dado importado
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description ?? `Importe uma planilha para visualizar os dados de ${module}.`}
        </p>
      </div>

      <button
        onClick={onImport}
        disabled={isLoading}
        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-full shadow-soft hover:shadow-card transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Upload className="h-4 w-4" />
        }
        Importar planilha (.xlsx)
      </button>

      <p className="mt-4 text-xs text-muted-foreground">
        Acesse <strong>Ajustes</strong> para baixar o modelo ou remover dados importados
      </p>
    </div>
  );
}
