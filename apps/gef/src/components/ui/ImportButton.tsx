import React from 'react';
import { Upload, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportButtonProps {
  hasData: boolean;
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

export function ImportButton({ hasData, isLoading = false, onClick, className }: ImportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      title={hasData ? 'Dados importados — clique para reimportar' : 'Importar planilha (.xlsx)'}
      className={cn(
        'group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold',
        'transition-all duration-200 border shadow-sm',
        hasData
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
      ) : hasData ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 group-hover:hidden" />
          <RefreshCw className="h-3.5 w-3.5 shrink-0 hidden group-hover:block" />
        </>
      ) : (
        <Upload className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="hidden sm:inline">
        {isLoading ? 'Importando...' : hasData ? 'Dados importados' : 'Importar dados'}
      </span>
    </button>
  );
}
