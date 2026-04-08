import React, { useState, useCallback, useRef } from 'react';
import {
  TrendingDown, PieChart, AlertTriangle,
  Download, FileSpreadsheet, CloudUpload,
  Wallet, BarChart2, Package, CheckCircle2, CircleDashed,
  Trash2, X,
} from 'lucide-react';
import { GlassCard } from '@socios/ui';
import { cn } from '@/lib/utils';
import { useSettings, DEBT_INDICADOR_ITEMS, BALANCE_INDICADOR_ITEMS } from '@/contexts/SettingsContext';
import { useImportedData } from '@/contexts/ImportDataContext';
import { useUniversalImport } from '@/hooks/useUniversalImport';
import { downloadTemplateUniversal } from '@/lib/xlsx/templateGenerator';
import type { ImportedDataStore } from '@/contexts/ImportDataContext';

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer shrink-0',
        enabled ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-card shadow-soft transition-transform duration-200',
        enabled ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  );
}

// ─── Section (indicadores) ───────────────────────────────────────────────────

function Section({
  icon, title, subtitle, items, visibility, onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: readonly { key: string; label: string }[];
  visibility: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const visibleCount = items.filter(i => visibility[i.key]).length;
  return (
    <GlassCard className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-muted rounded-xl text-muted-foreground">{icon}</div>
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap mt-1">
          {visibleCount}/{items.length} visíveis
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between py-3 gap-4">
            <span className={cn('text-sm font-medium transition-colors', visibility[item.key] ? 'text-foreground' : 'text-muted-foreground')}>
              {item.label}
            </span>
            <Toggle enabled={!!visibility[item.key]} onToggle={() => onToggle(item.key)} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Informações por módulo ───────────────────────────────────────────────────

const MODULE_INFO: Record<
  keyof ImportedDataStore,
  { label: string; icon: React.ReactNode; description: string }
> = {
  fluxoCaixa:    { label: 'Fluxo de Caixa',     icon: <Wallet      className="h-4 w-4" />, description: 'Aba Transações'             },
  fluxoAgregado: { label: 'Fluxo Agregado',     icon: <Wallet      className="h-4 w-4" />, description: 'Aba Fluxo Agregado'         },
  endividamento: { label: 'Endividamento',       icon: <TrendingDown className="h-4 w-4" />, description: 'Aba Parcelas'              },
  balanco:       { label: 'Balanço Patrimonial', icon: <PieChart    className="h-4 w-4" />, description: 'Abas Ativo + Passivo'       },
  dre:           { label: 'DRE',                 icon: <BarChart2   className="h-4 w-4" />, description: 'Aba DRE'                   },
  estoque:       { label: 'Estoque',             icon: <Package     className="h-4 w-4" />, description: 'Aba Estoque'               },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Card de status de módulo ─────────────────────────────────────────────────

function ModuleCard({
  moduleKey,
  importedAt,
  onClear,
}: {
  key?: React.Key;
  moduleKey: keyof ImportedDataStore;
  importedAt: string | null;
  onClear: () => void;
}) {
  const { label, icon, description } = MODULE_INFO[moduleKey];
  const hasData = !!importedAt;

  return (
    <div className={cn(
      'flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200',
      hasData
        ? 'bg-primary/5 border-primary/20'
        : 'bg-accent/60 border-border'
    )}>
      {/* Header do card */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          'p-2 rounded-xl transition-colors',
          hasData ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {icon}
        </div>
        {hasData
          ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          : <CircleDashed  className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        }
      </div>

      {/* Nome e info */}
      <div className="flex flex-col gap-0.5 flex-1">
        <span className={cn(
          'text-sm font-semibold leading-tight',
          hasData ? 'text-primary' : 'text-muted-foreground'
        )}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>

      {/* Status */}
      {hasData ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-primary font-medium">
            {formatDate(importedAt!)}
          </span>
          <button
            onClick={onClear}
            title="Remover dados importados"
            className={cn(
              'flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg',
              'text-xs font-semibold text-destructive border border-destructive/20 bg-destructive/5',
              'hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-150'
            )}
          >
            <Trash2 className="h-3 w-3" />
            Remover dados
          </button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">usando demonstração</span>
      )}
    </div>
  );
}

// ─── Modal de confirmação de sobrescrita ──────────────────────────────────────

function OverwriteDialog({
  labels,
  onConfirm,
  onCancel,
}: {
  labels: string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-warning/5 rounded-xl shrink-0">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Substituir dados?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        {/* Body */}
        <p className="text-sm text-muted-foreground">
          Os módulos abaixo já possuem dados importados e serão <strong>substituídos</strong> pelo novo arquivo:
        </p>

        <ul className="flex flex-col gap-2">
          {labels.map(label => (
            <li key={label} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              {label}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-soft"
          >
            Substituir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function AjustesDashboard() {
  const { debtIndicadores, balanceIndicadores, toggleDebt, toggleBalance } = useSettings();
  const { meta, clearModuleData } = useImportedData();

  // ── Estado do modal de sobrescrita ────────────────────────────────────────
  const [overwriteState, setOverwriteState] = useState<{
    labels: string[];
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirmOverwrite = useCallback(
    (labels: string[]) =>
      new Promise<boolean>(resolve => setOverwriteState({ labels, resolve })),
    [],
  );

  const { isLoading, openFilePicker, processFile } = useUniversalImport(confirmOverwrite);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const getImportedAt = (module: keyof ImportedDataStore) =>
    meta.find(m => m.module === module)?.importedAt ?? null;

  const moduleKeys = Object.keys(MODULE_INFO) as (keyof ImportedDataStore)[];
  const importedCount = moduleKeys.filter(k => getImportedAt(k) !== null).length;

  return (
    <>
      {/* Modal de sobrescrita */}
      {overwriteState && (
        <OverwriteDialog
          labels={overwriteState.labels}
          onConfirm={() => { overwriteState.resolve(true);  setOverwriteState(null); }}
          onCancel={()  => { overwriteState.resolve(false); setOverwriteState(null); }}
        />
      )}

      <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Ajustes</h1>
          <p className="text-muted-foreground mt-1">Configure indicadores e importe dados por módulo</p>
        </header>

        {/* ── Importação de Dados ───────────────────────────────────────── */}
        <GlassCard className="p-6 flex flex-col gap-6">
          {/* Título da seção */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Importação de Dados</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Importe um único arquivo <code className="bg-muted px-1 rounded text-xs">.xlsx</code> com uma ou mais abas reconhecidas
              </p>
            </div>
            {/* Badge de progresso */}
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0',
              importedCount === moduleKeys.length
                ? 'bg-primary/5 text-primary border-primary/20'
                : importedCount > 0
                  ? 'bg-warning/5 text-warning border-warning/20'
                  : 'bg-muted text-muted-foreground border-border'
            )}>
              {importedCount > 0 && <CheckCircle2 className="h-3 w-3" />}
              {importedCount}/{moduleKeys.length} módulos
            </div>
          </div>

          {/* ── Drop zone ─────────────────────────────────────────────── */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!isLoading ? openFilePicker : undefined}
            className={cn(
              'relative flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-2xl',
              'border-2 border-dashed transition-all duration-200',
              !isLoading && 'cursor-pointer',
              isDragging
                ? 'border-primary/40 bg-primary/5 scale-[1.01]'
                : isLoading
                  ? 'border-border bg-accent/50 opacity-70'
                  : 'border-border bg-accent/30 hover:border-primary/30 hover:bg-primary/5'
            )}
          >
            {/* Ícone central */}
            <div className={cn(
              'p-4 rounded-2xl transition-colors duration-200',
              isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {isLoading
                ? <FileSpreadsheet className="h-7 w-7 animate-pulse text-primary" />
                : <CloudUpload className={cn('h-7 w-7 transition-transform duration-200', isDragging && 'scale-110')} />
              }
            </div>

            {/* Texto */}
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {isLoading
                  ? 'Processando arquivo...'
                  : isDragging
                    ? 'Solte o arquivo aqui'
                    : 'Arraste e solte aqui ou clique para selecionar'
                }
              </p>
              {!isLoading && (
                <p className="text-xs text-muted-foreground mt-1">Somente arquivos .xlsx · Máximo 10MB</p>
              )}
            </div>

            {/* Botão secundário */}
            {!isLoading && !isDragging && (
              <button
                onClick={(e) => { e.stopPropagation(); openFilePicker(); }}
                className="mt-1 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl shadow-soft transition-colors duration-200"
              >
                Selecionar arquivo
              </button>
            )}
          </div>

          {/* ── Grade de módulos ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {moduleKeys.map(key => (
              <ModuleCard
                key={key}
                moduleKey={key}
                importedAt={getImportedAt(key)}
                onClear={() => clearModuleData(key)}
              />
            ))}
          </div>

          {/* ── Ação: baixar modelo ───────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Não tem o modelo?{' '}
              <button
                onClick={downloadTemplateUniversal}
                className="text-primary hover:text-primary font-medium underline underline-offset-2 transition-colors"
              >
                Baixe o modelo universal
              </button>
              {' '}com todas as abas preenchidas com dados de exemplo.
            </p>
            <button
              onClick={downloadTemplateUniversal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-card border border-border text-muted-foreground hover:bg-accent hover:border-border transition-all duration-200 shadow-soft shrink-0"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Baixar Modelo</span>
            </button>
          </div>
        </GlassCard>

        {/* ── Visibilidade de Indicadores ───────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section
            icon={<TrendingDown className="h-5 w-5" />}
            title="Indicadores de Endividamento"
            subtitle="Aba Indicadores — módulo Endividamento"
            items={DEBT_INDICADOR_ITEMS}
            visibility={debtIndicadores}
            onToggle={toggleDebt}
          />
          <Section
            icon={<PieChart className="h-5 w-5" />}
            title="Indicadores de Balanço Patrimonial"
            subtitle="Aba Indicadores — módulo Balanço Patrimonial"
            items={BALANCE_INDICADOR_ITEMS}
            visibility={balanceIndicadores}
            onToggle={toggleBalance}
          />
        </div>
      </div>
    </>
  );
}
