import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  idbSaveModule,
  idbDeleteModule,
  idbLoadAll,
  idbSaveMeta,
  idbLoadMeta,
} from '@/lib/storage/indexedDb';
import { useClient } from '@/contexts/ClientContext';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface TransactionRow {
  id: number;
  data: string;
  descricao: string;
  fornecedor: string;
  categoria: string;
  subcategoria?: string; // opcional — define hierarquia: categoria=subMaster, subcategoria=filho
  centroCusto: string;
  valor: number;
  status: 'pago' | 'recebido' | 'pendente' | 'atrasado';
  tipo: 'entrada' | 'saida';
}

/**
 * Lançamento agregado: uma linha por categoria/mês, em vez de uma linha por transação.
 * Usado para importar dados já consolidados de clientes com histórico existente.
 */
export interface AggregatedFlowRow {
  categoria: string;
  subcategoria?: string;          // opcional — define hierarquia no fluxo
  tipo: 'entrada' | 'saida';
  tipoLancamento: 'realizado' | 'orcado';
  ano: number;                    // ano de referência (ex: 2026)
  valores: number[];              // [jan, fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez]
}

export interface ParcelaRow {
  mesAno: string;
  banco: string;
  contrato: string;
  tipo: string;
  descricao: string;
  principal: number;
  juros: number;
  total: number;
  taxa: number;
}

export interface BalanceTableRow {
  id: string;
  name: string;
  level: number;
  values: number[]; // comprimento igual a columns — ex: [58980000, 64980000, 70820437, 54428694]
  fazenda?: string;
  children?: BalanceTableRow[];
}

export interface CulturaImportData {
  nome: string;
  area: number;
  producao: number;
  produtividade: number;
  precoMedio: number;
  receitaBruta: number;
  custoTotal: number;
  margemLiquida: number;
  variacaoMargem: number;
}

export interface SafraImportData {
  safra: string;
  fazenda?: string;
  atividade?: string;
  areaTotal: number;
  producaoTotal: number;
  produtividadeMedia: number;
  precoMedioVenda: number;
  receitaBruta: number;
  custoTotal: number;
  custoInsumos: number;
  custoOperacao: number;
  custoJuros: number;
  lucroBruto: number;
  despesasOperacionais: number;
  ebitda: number;
  resultadoLiquido: number;
  margemBruta: number;
  margemLiquida: number;
  pontoEquilibrio: number;
  roi: number;
  orcadoVbp: number;
  orcadoCusto: number;
  orcadoResultado: number;
  culturas: CulturaImportData[];
}

export interface SaleImportRecord {
  date: string;
  quantity: number;
  avgPrice: number;
  totalValue: number;
}

export interface CropStockImport {
  name: string;
  color: string;
  bgColor: string;
  initialStock: number;
  soldStock: number;
  sales: SaleImportRecord[];
}

// ─── Store Shape ──────────────────────────────────────────────────────────────

export interface ImportedDataStore {
  fluxoCaixa:    { transactions: TransactionRow[]; saldoInicial?: number } | null;
  fluxoAgregado: { rows: AggregatedFlowRow[] } | null;
  endividamento: { parcelas: ParcelaRow[] } | null;
  balanco:       { columns: string[]; fazendas: string[]; ativo: BalanceTableRow[]; passivo: BalanceTableRow[] } | null;
  dre:           { safras: SafraImportData[] } | null;
  estoque:       { crops: CropStockImport[] } | null;
}

export interface ImportMeta {
  module: keyof ImportedDataStore;
  importedAt: string; // ISO string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyStore(): ImportedDataStore {
  return { fluxoCaixa: null, fluxoAgregado: null, endividamento: null, balanco: null, dre: null, estoque: null };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ImportDataContextValue {
  /** Dados importados (null por módulo = usando mock) */
  data: ImportedDataStore;
  /** Metadados leves (quando cada módulo foi importado) */
  meta: ImportMeta[];
  /** true enquanto o IndexedDB ainda não terminou de carregar */
  isReady: boolean;
  /** Salva dados de múltiplos módulos de uma só vez (import universal) */
  bulkSetData: (partial: Partial<ImportedDataStore>) => Promise<void>;
  /** Setters individuais (mantidos para compatibilidade) */
  setFluxoCaixaData:    (d: ImportedDataStore['fluxoCaixa'])    => Promise<void>;
  setEndividamentoData: (d: ImportedDataStore['endividamento']) => Promise<void>;
  setBalancoData:       (d: ImportedDataStore['balanco'])       => Promise<void>;
  setDREData:           (d: ImportedDataStore['dre'])           => Promise<void>;
  setEstoqueData:       (d: ImportedDataStore['estoque'])       => Promise<void>;
  clearModuleData:      (module: keyof ImportedDataStore)       => Promise<void>;
}

const ImportDataContext = createContext<ImportDataContextValue>({
  data:    emptyStore(),
  meta:    [],
  isReady: false,
  bulkSetData:          async () => {},
  setFluxoCaixaData:    async () => {},
  setEndividamentoData: async () => {},
  setBalancoData:       async () => {},
  setDREData:           async () => {},
  setEstoqueData:       async () => {},
  clearModuleData:      async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ImportDataProvider({ children }: { children: React.ReactNode }) {
  const { activeClient, isReady: clientReady } = useClient();
  const activeClientId = activeClient?.id ?? null;

  const [data,    setData]    = useState<ImportedDataStore>(emptyStore);
  const [meta,    setMeta]    = useState<ImportMeta[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Ref para evitar re-carregar quando meta muda (apenas clientId importa para reload)
  const metaRef = useRef(meta);
  metaRef.current = meta;

  // Carrega dados do IndexedDB sempre que o cliente ativo mudar
  useEffect(() => {
    if (!clientReady || !activeClientId) return;

    setIsReady(false);
    setData(emptyStore());
    setMeta([]);

    Promise.all([idbLoadAll(activeClientId), idbLoadMeta(activeClientId)])
      .then(([storedData, storedMeta]) => {
        setData(prev => ({ ...prev, ...storedData }));
        setMeta(storedMeta);
      })
      .catch(console.error)
      .finally(() => setIsReady(true));
  }, [clientReady, activeClientId]);

  // Persiste meta no IndexedDB
  const persistMeta = useCallback(async (modules: (keyof ImportedDataStore)[], prevMeta: ImportMeta[]) => {
    if (!activeClientId) return;
    const now = new Date().toISOString();
    const filtered = prevMeta.filter(m => !modules.includes(m.module));
    const next = [...filtered, ...modules.map(module => ({ module, importedAt: now }))];
    setMeta(next);
    await idbSaveMeta(activeClientId, next);
  }, [activeClientId]);

  // ── bulkSetData ────────────────────────────────────────────────────────────
  const bulkSetData = useCallback(async (partial: Partial<ImportedDataStore>) => {
    if (!activeClientId) return;
    const updatedModules = Object.keys(partial) as (keyof ImportedDataStore)[];

    // Atualiza estado React sincronamente para UI responsiva
    setData(prev => ({ ...prev, ...partial }));

    // Persiste no IndexedDB (assíncrono, em paralelo)
    await Promise.all([
      ...updatedModules.map(key => {
        const val = partial[key];
        return val !== null && val !== undefined
          ? idbSaveModule(activeClientId, key, val as ImportedDataStore[typeof key])
          : idbDeleteModule(activeClientId, key);
      }),
      persistMeta(updatedModules, metaRef.current),
    ]);
  }, [activeClientId, persistMeta]);

  // ── Setters individuais (wrappers de bulkSetData) ─────────────────────────
  const setFluxoCaixaData    = useCallback((d: ImportedDataStore['fluxoCaixa'])    => bulkSetData({ fluxoCaixa: d }),    [bulkSetData]);
  const setEndividamentoData = useCallback((d: ImportedDataStore['endividamento']) => bulkSetData({ endividamento: d }), [bulkSetData]);
  const setBalancoData       = useCallback((d: ImportedDataStore['balanco'])       => bulkSetData({ balanco: d }),       [bulkSetData]);
  const setDREData           = useCallback((d: ImportedDataStore['dre'])           => bulkSetData({ dre: d }),           [bulkSetData]);
  const setEstoqueData       = useCallback((d: ImportedDataStore['estoque'])       => bulkSetData({ estoque: d }),       [bulkSetData]);

  // ── clearModuleData ────────────────────────────────────────────────────────
  const clearModuleData = useCallback(async (module: keyof ImportedDataStore) => {
    if (!activeClientId) return;
    setData(prev => ({ ...prev, [module]: null }));
    await idbDeleteModule(activeClientId, module);
    setMeta(prev => {
      const next = prev.filter(m => m.module !== module);
      idbSaveMeta(activeClientId, next).catch(console.error);
      return next;
    });
  }, [activeClientId]);

  return (
    <ImportDataContext.Provider value={{
      data, meta, isReady,
      bulkSetData,
      setFluxoCaixaData,
      setEndividamentoData,
      setBalancoData,
      setDREData,
      setEstoqueData,
      clearModuleData,
    }}>
      {children}
    </ImportDataContext.Provider>
  );
}

export const useImportedData = () => useContext(ImportDataContext);
