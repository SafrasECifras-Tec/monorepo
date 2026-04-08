import React from 'react';
import { Upload, Download, Trash2, CheckCircle2, Database } from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';

interface ImportCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  importedAt?: string | null;    // ISO string or null
  isLoading?: boolean;
  onImport: () => void;
  onDownloadTemplate: () => void;
  onClear: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ImportCard({
  title,
  description,
  icon,
  importedAt,
  isLoading = false,
  onImport,
  onDownloadTemplate,
  onClear,
}: ImportCardProps) {
  const hasData = !!importedAt;

  return (
    <GlassCard className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2.5 rounded-xl shrink-0',
            hasData ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
          )}>
            {icon ?? <Database className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        {hasData && (
          <div className="flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">Importado</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className={cn(
        'px-3 py-2 rounded-lg text-xs font-medium',
        hasData
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          : 'bg-slate-50 text-slate-500 border border-slate-100'
      )}>
        {hasData
          ? `Dados importados em ${formatDate(importedAt!)}`
          : 'Usando dados de demonstração'}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onImport}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
            'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          {isLoading ? 'Importando...' : 'Importar .xlsx'}
        </button>

        <button
          onClick={onDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar Modelo
        </button>

        {hasData && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-all duration-200 ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover dados
          </button>
        )}
      </div>
    </GlassCard>
  );
}
