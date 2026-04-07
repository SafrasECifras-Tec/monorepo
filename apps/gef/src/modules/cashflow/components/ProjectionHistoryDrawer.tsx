import React, { useState } from 'react';
import { X, Clock, Trash2, Eye, FileText, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectionSnapshot } from '@/data/cashflow/projectionsHistoryData';
import { deleteSnapshot } from '@/data/cashflow/projectionsHistoryData';
import { MONTHS_PT } from '@/lib/formatters';
import type { CategoryData } from '@/data/cashflow/realizedProjectedData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  snapshots: ProjectionSnapshot[];
  onSnapshotsChange: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const fmtVal = (v: number) =>
  v === 0 ? <span className="text-muted-foreground">—</span> :
  <span>{v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;

const rowTotal = (values: number[]) => values.reduce((a, b) => a + b, 0);

// ── Full table view ──────────────────────────────────────────────────────────

function FullTable({ data }: { data: CategoryData[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    data.forEach(m => {
      init[m.name] = true;
      m.children?.forEach(c => { if (c.isSubMaster) init[c.name] = true; });
    });
    return init;
  });

  const toggle = (name: string) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  const COL = `minmax(200px, 2fr) repeat(12, minmax(80px, 1fr)) minmax(100px, 1fr)`;

  return (
    <div className="overflow-auto custom-scrollbar text-xs">
      <div style={{ minWidth: 1400 }}>
        {/* Header */}
        <div className="grid sticky top-0 z-10 bg-muted font-semibold text-foreground border-b border-border" style={{ gridTemplateColumns: COL }}>
          <div className="px-4 py-2.5 border-r border-border">Categorias</div>
          {MONTHS_PT.map(m => (
            <div key={m} className="px-2 py-2.5 text-right border-r border-border">{m.slice(0, 3)}</div>
          ))}
          <div className="px-2 py-2.5 text-right bg-muted font-bold">Total</div>
        </div>

        {/* Rows */}
        {data.map(master => {
          const isMasterOpen = expanded[master.name];
          const masterColor = master.name === 'ENTRADAS' ? 'text-primary bg-primary/5'
            : master.name === 'SAÍDAS' ? 'text-destructive bg-destructive/5'
            : 'text-foreground bg-accent';

          let currentSubOpen = true;
          let currentSubName = '';

          return (
            <React.Fragment key={master.name}>
              {/* Master */}
              <div
                className={cn('grid font-bold border-b border-border cursor-pointer hover:brightness-95 transition-all', masterColor)}
                style={{ gridTemplateColumns: COL }}
                onClick={() => toggle(master.name)}
              >
                <div className="px-4 py-2.5 border-r border-border flex items-center gap-2">
                  {isMasterOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  {master.name}
                </div>
                {master.values.map((v, i) => (
                  <div key={i} className="px-2 py-2.5 text-right border-r border-border font-mono">{fmtVal(v)}</div>
                ))}
                <div className="px-2 py-2.5 text-right font-mono bg-muted/60">{fmtVal(rowTotal(master.values))}</div>
              </div>

              {/* Children */}
              {isMasterOpen && master.children?.map(child => {
                if (child.isSubMaster) {
                  currentSubOpen = expanded[child.name] !== false;
                  currentSubName = child.name;
                  return (
                    <div
                      key={child.name}
                      className="grid bg-muted font-semibold text-foreground border-b border-border cursor-pointer hover:bg-muted/60"
                      style={{ gridTemplateColumns: COL }}
                      onClick={() => toggle(child.name)}
                    >
                      <div className="px-4 py-2 border-r border-border flex items-center gap-2 pl-10">
                        {currentSubOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                        {child.name}
                      </div>
                      {child.values.map((v, i) => (
                        <div key={i} className="px-2 py-2 text-right border-r border-border font-mono">{fmtVal(v)}</div>
                      ))}
                      <div className="px-2 py-2 text-right font-mono bg-muted/60">{fmtVal(rowTotal(child.values))}</div>
                    </div>
                  );
                }

                if (!currentSubOpen) return null;

                return (
                  <div
                    key={child.name}
                    className="grid bg-card border-b border-border/50 hover:bg-accent/50"
                    style={{ gridTemplateColumns: COL }}
                  >
                    <div className="px-4 py-2 border-r border-border/50 text-muted-foreground pl-16">{child.name}</div>
                    {child.values.map((v, i) => (
                      <div key={i} className="px-2 py-2 text-right border-r border-border/50 font-mono text-muted-foreground">{fmtVal(v)}</div>
                    ))}
                    <div className="px-2 py-2 text-right font-mono text-foreground bg-muted/60">{fmtVal(rowTotal(child.values))}</div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Full-screen snapshot viewer ──────────────────────────────────────────────

function SnapshotViewer({ snapshot, onBack }: { snapshot: ProjectionSnapshot; onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-accent shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="w-px h-5 bg-border" />
          <div>
            <p className="font-bold text-foreground text-sm">{snapshot.label}</p>
            <p className="text-xs text-muted-foreground">{formatDate(snapshot.savedAt)}</p>
          </div>
        </div>
        {snapshot.notes && (
          <p className="text-xs text-muted-foreground italic max-w-md truncate">{snapshot.notes}</p>
        )}
        <button onClick={onBack} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full border border-border rounded-xl overflow-hidden">
          <FullTable data={snapshot.monthlyData} />
        </div>
      </div>
    </div>
  );
}

// ── Main drawer ──────────────────────────────────────────────────────────────

export function ProjectionHistoryDrawer({ isOpen, onClose, snapshots, onSnapshotsChange }: Props) {
  const [viewingSnapshot, setViewingSnapshot] = useState<ProjectionSnapshot | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteSnapshot(id);
    onSnapshotsChange();
    setConfirmDeleteId(null);
  };

  if (viewingSnapshot) {
    return <SnapshotViewer snapshot={viewingSnapshot} onBack={() => setViewingSnapshot(null)} />;
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[45] bg-foreground/30 backdrop-blur-sm" onClick={onClose} />}

      <div className={cn(
        "fixed right-0 top-0 h-full z-[46] w-full max-w-lg bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Histórico de Projeções</h2>
              <p className="text-xs text-muted-foreground">{snapshots.length} {snapshots.length === 1 ? 'sessão salva' : 'sessões salvas'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 flex flex-col gap-3">
          {snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-sm font-medium">Nenhuma projeção salva ainda</p>
              <p className="text-xs text-center">Use o botão "Salvar Projeção" para registrar o estado atual do fluxo de caixa.</p>
            </div>
          ) : snapshots.map(snap => {
            const isConfirmDelete = confirmDeleteId === snap.id;

            return (
              <div key={snap.id} className="border border-border rounded-xl p-4 bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{snap.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(snap.savedAt)}</p>
                    {snap.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">{snap.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setViewingSnapshot(snap)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver tabela
                    </button>
                    {isConfirmDelete ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(snap.id)} className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                          Confirmar
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(snap.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
