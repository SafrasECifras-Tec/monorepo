import React, { createContext, useContext, useReducer, useMemo, useEffect, useState, useCallback, useRef } from "react";
import {
  loadClientData,
  saveClientData,
  ensureCalcirBasePadrao,
  loadCalcirAnalisePayload,
  saveCalcirAnalisePayload,
  isCalcirCowEnabled,
  loadCalcirReceitasEfetivas,
  loadCalcirDespesasEfetivas,
  updateReceitaCOW,
  createReceitaCOW,
  updateDespesaCOW,
  createDespesaCOW,
  softDeleteReceitaCOW,
  softDeleteDespesaCOW,
  listCalcirAnaliseOrigens,
  saveCalcirAnaliseOrigens,
  createCalcirAnalise,
  duplicateCalcirAnalise,
  updateCalcirAnalise,
  deleteCalcirAnalise,
  setAnaliseBasePadrao,
  type CalcirAnalise,
  type CalcirAnaliseOrigem,
  getFarmDataWatermark,
} from "@/services/supabaseData";
import {
  MESES,
  FUNRURAL_PF_ALIQUOTA,
  calcularIRPF,
  calcularDistribuicaoDividendos,
  calcularRetencaoFonteMensal,
  calcularResultadoParceiro,
  calcularIRPFExclusivoPF,
  calcularEconomia,
  calcularIRPFM,
  calcularTrimestresPJ,
  calcularDiferencaFunrural,
  type ImpostosPJ,
  type DistribuicaoDividendos,
  type ResultadoParceiro,
  type TrimestrePJ,
  type FunruralPJRegime,
  type RegimeApuracaoRural,
} from "@/lib/calcirEngine";

// ============= Types =============

export interface Parceiro {
  id: string;
  nome: string;
  cpf: string;
  participacao: number;
}

export interface ReceitaItem {
  id: string;
  produto: string;
  obs: string;
  entidade: "PJ" | "PF";
  pisCofins: boolean;
  /** Quando true, esta receita não incide Funrural (ex: exportações, criação de animais) */
  funruralNaoIncidente: boolean;
  mes: string;
  quantidade: number;
  valorUnit: number;
  total: number;
  estoque: number;
}

export interface VendaImobilizado {
  id: string;
  descricao: string;
  entidade: "PJ" | "PF";
  mes: string;
  realizado: number;
  projetado: number;
  total: number;
}

export type CreditoIBSCBS = "cheia" | "reducao60" | "diesel" | "simples_nacional" | "sem_credito";

export interface DespesaItem {
  id: string;
  descricao: string;
  obs: string;
  entidade: "PF" | "PJ";
  totalAnoAnterior: number;
  realizado: number;
  aRealizar: number;
  total: number;
  creditoIBSCBS: CreditoIBSCBS;
  estoque: number;
  /** Apenas para creditoIBSCBS === "diesel": litros consumidos no período */
  quantidadeLitros?: number;
  /** Apenas para creditoIBSCBS === "simples_nacional": % de crédito transferível conforme NF do fornecedor (0-100) */
  percentualCreditoSN?: number;
}

export interface ImobilizadoAquisicao {
  id: string;
  descricao: string;
  entidade: "PJ" | "PF";
  realizado: number;
  aRealizar: number;
  total: number;
}

export interface AtividadeRuralParticular {
  parceiroId: string;
  receitas: number[];
  despesas: number[];
}

export interface RendimentosParticulares {
  parceiroId: string;
  dividendos: number[];
  alugueis: number[];
  proLabore: number[];
  rendAplicacoes: number[];
  rendProtegidos: number[];
  doacoes: number[];
  ganhoCapital: number[];
}

export interface RetencoesParticulares {
  parceiroId: string;
  irrfDividendos: number[];
  irrfAlugueis: number[];
  irrfProLabore: number[];
  irrfRendAplicacoes: number[];
  irrfOperacoesBolsa: number[];
}

export interface CalcirState {
  parceiros: Parceiro[];
  receitasProjecoes: ReceitaItem[];
  receitasRealizacoes: ReceitaItem[];
  vendasImobilizado: VendaImobilizado[];
  despesas: DespesaItem[];
  imobilizadoAquisicao: ImobilizadoAquisicao[];
  atividadeRuralParticular: AtividadeRuralParticular[];
  rendimentosParticulares: RendimentosParticulares[];
  retencoesParticulares: RetencoesParticulares[];
  demaisDespesasPJ: number;
  lucroAcumuladoPJ: number;
  funruralPJRegime: FunruralPJRegime;
  funruralPJAliquota: number;
  folhaPagamentoPJ: number;
  funruralPFRegime: FunruralPJRegime;
  funruralPFAliquota: number;
  folhaPagamentoPF: number;
  prejuizosAnteriores: Record<string, number>;
  lucrosIsentosAcumulados: Record<string, number>;
  regimeApuracaoRural: Record<string, "automatico" | "arbitramento" | "resultado">;
  contabilidadeRegular: boolean;
  lcdprLimite: number;
  simulacaoDespesasPFPerc: number | null;
  /** Alíquota de IBS/CBS por litro de combustível (R$/litro). 0 = aguardando publicação do Comitê Gestor. */
  aliquotaDieselPorLitro: number;
}

// ============= Initial Data =============

const zeros12 = () => Array(12).fill(0) as number[];

const initialState: CalcirState = {
  parceiros: [],
  receitasProjecoes: [],
  receitasRealizacoes: [],
  vendasImobilizado: [],
  despesas: [],
  imobilizadoAquisicao: [],
  atividadeRuralParticular: [],
  rendimentosParticulares: [],
  retencoesParticulares: [],
  demaisDespesasPJ: 0,
  lucroAcumuladoPJ: 0,
  funruralPJRegime: "receita_bruta",
  funruralPJAliquota: 0.0223,
  folhaPagamentoPJ: 0,
  funruralPFRegime: "receita_bruta",
  funruralPFAliquota: 0.0163,
  folhaPagamentoPF: 0,
  prejuizosAnteriores: {},
  lucrosIsentosAcumulados: {},
  regimeApuracaoRural: {},
  contabilidadeRegular: false,
  lcdprLimite: 4800000,
  simulacaoDespesasPFPerc: null,
  aliquotaDieselPorLitro: 0,
};

// ============= Actions =============

type Action =
  | { type: "UPDATE_PARCEIRO"; payload: Parceiro }
  | { type: "ADD_PARCEIRO"; payload: Parceiro }
  | { type: "DELETE_PARCEIRO"; payload: string }
  | { type: "UPDATE_RECEITA_PROJECAO"; payload: ReceitaItem }
  | { type: "ADD_RECEITA_PROJECAO"; payload: ReceitaItem }
  | { type: "DELETE_RECEITA_PROJECAO"; payload: string }
  | { type: "UPDATE_RECEITA_REALIZACAO"; payload: ReceitaItem }
  | { type: "ADD_RECEITA_REALIZACAO"; payload: ReceitaItem }
  | { type: "DELETE_RECEITA_REALIZACAO"; payload: string }
  | { type: "UPDATE_DESPESA"; payload: DespesaItem }
  | { type: "ADD_DESPESA"; payload: DespesaItem }
  | { type: "DELETE_DESPESA"; payload: string }
  | { type: "ADD_VENDA_IMOBILIZADO"; payload: VendaImobilizado }
  | { type: "UPDATE_VENDA_IMOBILIZADO"; payload: VendaImobilizado }
  | { type: "DELETE_VENDA_IMOBILIZADO"; payload: string }
  | { type: "ADD_IMOBILIZADO_AQUISICAO"; payload: ImobilizadoAquisicao }
  | { type: "UPDATE_IMOBILIZADO_AQUISICAO"; payload: ImobilizadoAquisicao }
  | { type: "DELETE_IMOBILIZADO_AQUISICAO"; payload: string }
  | { type: "UPDATE_ATIVIDADE_PARTICULAR"; payload: AtividadeRuralParticular }
  | { type: "UPDATE_RENDIMENTOS_PARTICULARES"; payload: RendimentosParticulares }
  | { type: "UPDATE_RETENCOES_PARTICULARES"; payload: RetencoesParticulares }
  | { type: "UPDATE_DEMAIS_DESPESAS_PJ"; payload: number }
  | { type: "UPDATE_LUCRO_ACUMULADO_PJ"; payload: number }
  | { type: "UPDATE_FUNRURAL_PJ_REGIME"; payload: FunruralPJRegime }
  | { type: "UPDATE_FUNRURAL_PJ_ALIQUOTA"; payload: number }
  | { type: "UPDATE_FOLHA_PAGAMENTO_PJ"; payload: number }
  | { type: "UPDATE_FUNRURAL_PF_REGIME"; payload: FunruralPJRegime }
  | { type: "UPDATE_FUNRURAL_PF_ALIQUOTA"; payload: number }
  | { type: "UPDATE_FOLHA_PAGAMENTO_PF"; payload: number }
  | { type: "UPDATE_PREJUIZO_ANTERIOR"; payload: { parceiroId: string; valor: number } }
  | { type: "UPDATE_LUCROS_ISENTOS"; payload: { parceiroId: string; valor: number } }
  | { type: "UPDATE_REGIME_APURACAO_RURAL"; payload: { parceiroId: string; regime: "automatico" | "arbitramento" | "resultado" } }
  | { type: "UPDATE_CONTABILIDADE_REGULAR"; payload: boolean }
  | { type: "UPDATE_LCDPR_LIMITE"; payload: number }
  | { type: "UPDATE_SIMULACAO_DESPESAS_PF_PERC"; payload: number | null }
  | { type: "UPDATE_ALIQUOTA_DIESEL_POR_LITRO"; payload: number }
  | { type: "BULK_DELETE_RECEITA_PROJECAO"; payload: string[] }
  | { type: "BULK_DELETE_RECEITA_REALIZACAO"; payload: string[] }
  | { type: "BULK_DELETE_DESPESA"; payload: string[] }
  | { type: "BULK_DELETE_VENDA_IMOBILIZADO"; payload: string[] }
  | { type: "BULK_UPDATE_VENDA_IMOBILIZADO"; payload: { ids: string[]; fields: Partial<VendaImobilizado> } }
  | { type: "BULK_DELETE_IMOBILIZADO_AQUISICAO"; payload: string[] }
  | { type: "BULK_UPDATE_IMOBILIZADO_AQUISICAO"; payload: { ids: string[]; fields: Partial<ImobilizadoAquisicao> } }
  | { type: "BULK_UPDATE_RECEITA_PROJECAO"; payload: { ids: string[]; fields: Partial<ReceitaItem> } }
  | { type: "BULK_UPDATE_RECEITA_REALIZACAO"; payload: { ids: string[]; fields: Partial<ReceitaItem> } }
  | { type: "BULK_UPDATE_DESPESA"; payload: { ids: string[]; fields: Partial<DespesaItem> } }
  | { type: "SET_STATE"; payload: Partial<CalcirState> };

function reducer(state: CalcirState, action: Action): CalcirState {
  switch (action.type) {
    case "UPDATE_PARCEIRO": {
      const p = action.payload;
      return {
        ...state,
        parceiros: state.parceiros.map(item => item.id === p.id ? p : item),
        atividadeRuralParticular: state.atividadeRuralParticular.map(item => item.parceiroId === p.id ? { ...item, parceiroId: p.id } : item),
        rendimentosParticulares: state.rendimentosParticulares.map(item => item.parceiroId === p.id ? { ...item, parceiroId: p.id } : item),
        retencoesParticulares: state.retencoesParticulares.map(item => item.parceiroId === p.id ? { ...item, parceiroId: p.id } : item),
        prejuizosAnteriores: Object.fromEntries(
          Object.entries(state.prejuizosAnteriores).map(([id, val]) => [id === p.id ? p.id : id, val])
        ),
        lucrosIsentosAcumulados: Object.fromEntries(
          Object.entries(state.lucrosIsentosAcumulados).map(([id, val]) => [id === p.id ? p.id : id, val])
        ),
        regimeApuracaoRural: Object.fromEntries(
          Object.entries(state.regimeApuracaoRural).map(([id, val]) => [id === p.id ? p.id : id, val])
        ),
      };
    }
    case "ADD_PARCEIRO": {
      const p = action.payload;
      return {
        ...state,
        parceiros: [p, ...state.parceiros],
        atividadeRuralParticular: [{ parceiroId: p.id, receitas: zeros12(), despesas: zeros12() }, ...state.atividadeRuralParticular],
        rendimentosParticulares: [{ parceiroId: p.id, dividendos: zeros12(), alugueis: zeros12(), proLabore: zeros12(), rendAplicacoes: zeros12(), rendProtegidos: zeros12(), doacoes: zeros12(), ganhoCapital: zeros12() }, ...state.rendimentosParticulares],
        retencoesParticulares: [{ parceiroId: p.id, irrfDividendos: zeros12(), irrfAlugueis: zeros12(), irrfProLabore: zeros12(), irrfRendAplicacoes: zeros12(), irrfOperacoesBolsa: zeros12() }, ...state.retencoesParticulares],
        regimeApuracaoRural: { ...state.regimeApuracaoRural, [p.id]: "automatico" },
      };
    }
    case "DELETE_PARCEIRO":
      return {
        ...state,
        parceiros: state.parceiros.filter(p => p.id !== action.payload),
        atividadeRuralParticular: state.atividadeRuralParticular.filter(a => a.parceiroId !== action.payload),
        rendimentosParticulares: state.rendimentosParticulares.filter(r => r.parceiroId !== action.payload),
        retencoesParticulares: state.retencoesParticulares.filter(r => r.parceiroId !== action.payload),
        regimeApuracaoRural: Object.fromEntries(Object.entries(state.regimeApuracaoRural).filter(([id]) => id !== action.payload)),
        prejuizosAnteriores: Object.fromEntries(Object.entries(state.prejuizosAnteriores).filter(([id]) => id !== action.payload)),
        lucrosIsentosAcumulados: Object.fromEntries(Object.entries(state.lucrosIsentosAcumulados).filter(([id]) => id !== action.payload)),
      };
    case "UPDATE_CONTABILIDADE_REGULAR":
      return { ...state, contabilidadeRegular: action.payload };
    case "UPDATE_LCDPR_LIMITE":
      return { ...state, lcdprLimite: action.payload };
    case "UPDATE_SIMULACAO_DESPESAS_PF_PERC":
      return { ...state, simulacaoDespesasPFPerc: action.payload };
    case "UPDATE_ALIQUOTA_DIESEL_POR_LITRO":
      return { ...state, aliquotaDieselPorLitro: action.payload };
    case "ADD_RECEITA_PROJECAO":
      return { ...state, receitasProjecoes: [...state.receitasProjecoes, action.payload] };
    case "UPDATE_RECEITA_PROJECAO":
      return { ...state, receitasProjecoes: state.receitasProjecoes.map(r => r.id === action.payload.id ? action.payload : r) };
    case "DELETE_RECEITA_PROJECAO":
      return { ...state, receitasProjecoes: state.receitasProjecoes.filter(r => r.id !== action.payload) };
    case "ADD_RECEITA_REALIZACAO":
      return { ...state, receitasRealizacoes: [...state.receitasRealizacoes, action.payload] };
    case "UPDATE_RECEITA_REALIZACAO":
      return { ...state, receitasRealizacoes: state.receitasRealizacoes.map(r => r.id === action.payload.id ? action.payload : r) };
    case "DELETE_RECEITA_REALIZACAO":
      return { ...state, receitasRealizacoes: state.receitasRealizacoes.filter(r => r.id !== action.payload) };
    case "ADD_DESPESA":
      return { ...state, despesas: [...state.despesas, action.payload] };
    case "UPDATE_DESPESA":
      return { ...state, despesas: state.despesas.map(d => d.id === action.payload.id ? action.payload : d) };
    case "DELETE_DESPESA":
      return { ...state, despesas: state.despesas.filter(d => d.id !== action.payload) };
    case "ADD_VENDA_IMOBILIZADO":
      return { ...state, vendasImobilizado: [...state.vendasImobilizado, action.payload] };
    case "UPDATE_VENDA_IMOBILIZADO":
      return { ...state, vendasImobilizado: state.vendasImobilizado.map(v => v.id === action.payload.id ? action.payload : v) };
    case "DELETE_VENDA_IMOBILIZADO":
      return { ...state, vendasImobilizado: state.vendasImobilizado.filter(v => v.id !== action.payload) };
    case "ADD_IMOBILIZADO_AQUISICAO":
      return { ...state, imobilizadoAquisicao: [...state.imobilizadoAquisicao, action.payload] };
    case "UPDATE_IMOBILIZADO_AQUISICAO":
      return { ...state, imobilizadoAquisicao: state.imobilizadoAquisicao.map(i => i.id === action.payload.id ? action.payload : i) };
    case "DELETE_IMOBILIZADO_AQUISICAO":
      return { ...state, imobilizadoAquisicao: state.imobilizadoAquisicao.filter(i => i.id !== action.payload) };
    case "UPDATE_ATIVIDADE_PARTICULAR":
      return { ...state, atividadeRuralParticular: state.atividadeRuralParticular.map(a => a.parceiroId === action.payload.parceiroId ? action.payload : a) };
    case "UPDATE_RENDIMENTOS_PARTICULARES":
      return { ...state, rendimentosParticulares: state.rendimentosParticulares.map(r => r.parceiroId === action.payload.parceiroId ? action.payload : r) };
    case "UPDATE_RETENCOES_PARTICULARES":
      return { ...state, retencoesParticulares: state.retencoesParticulares.map(r => r.parceiroId === action.payload.parceiroId ? action.payload : r) };
    case "UPDATE_DEMAIS_DESPESAS_PJ":
      return { ...state, demaisDespesasPJ: action.payload };
    case "UPDATE_LUCRO_ACUMULADO_PJ":
      return { ...state, lucroAcumuladoPJ: action.payload };
    case "UPDATE_FUNRURAL_PJ_REGIME":
      return { ...state, funruralPJRegime: action.payload };
    case "UPDATE_FUNRURAL_PJ_ALIQUOTA":
      return { ...state, funruralPJAliquota: action.payload };
    case "UPDATE_FOLHA_PAGAMENTO_PJ":
      return { ...state, folhaPagamentoPJ: action.payload };
    case "UPDATE_FUNRURAL_PF_REGIME":
      return { ...state, funruralPFRegime: action.payload };
    case "UPDATE_FUNRURAL_PF_ALIQUOTA":
      return { ...state, funruralPFAliquota: action.payload };
    case "UPDATE_FOLHA_PAGAMENTO_PF":
      return { ...state, folhaPagamentoPF: action.payload };
    case "UPDATE_PREJUIZO_ANTERIOR":
      return { ...state, prejuizosAnteriores: { ...state.prejuizosAnteriores, [action.payload.parceiroId]: action.payload.valor } };
    case "UPDATE_LUCROS_ISENTOS":
      return { ...state, lucrosIsentosAcumulados: { ...state.lucrosIsentosAcumulados, [action.payload.parceiroId]: action.payload.valor } };
    case "UPDATE_REGIME_APURACAO_RURAL":
      return { ...state, regimeApuracaoRural: { ...state.regimeApuracaoRural, [action.payload.parceiroId]: action.payload.regime } };
    case "BULK_DELETE_RECEITA_PROJECAO": {
      const ids = new Set(action.payload);
      return { ...state, receitasProjecoes: state.receitasProjecoes.filter(r => !ids.has(r.id)) };
    }
    case "BULK_DELETE_RECEITA_REALIZACAO": {
      const ids = new Set(action.payload);
      return { ...state, receitasRealizacoes: state.receitasRealizacoes.filter(r => !ids.has(r.id)) };
    }
    case "BULK_DELETE_DESPESA": {
      const ids = new Set(action.payload);
      return { ...state, despesas: state.despesas.filter(d => !ids.has(d.id)) };
    }
    case "BULK_DELETE_VENDA_IMOBILIZADO": {
      const ids = new Set(action.payload);
      return { ...state, vendasImobilizado: state.vendasImobilizado.filter(v => !ids.has(v.id)) };
    }
    case "BULK_UPDATE_VENDA_IMOBILIZADO": {
      const ids = new Set(action.payload.ids);
      const f = action.payload.fields;
      return { ...state, vendasImobilizado: state.vendasImobilizado.map(v => ids.has(v.id) ? { ...v, ...f } : v) };
    }
    case "BULK_DELETE_IMOBILIZADO_AQUISICAO": {
      const ids = new Set(action.payload);
      return { ...state, imobilizadoAquisicao: state.imobilizadoAquisicao.filter(i => !ids.has(i.id)) };
    }
    case "BULK_UPDATE_IMOBILIZADO_AQUISICAO": {
      const ids = new Set(action.payload.ids);
      const f = action.payload.fields;
      return { ...state, imobilizadoAquisicao: state.imobilizadoAquisicao.map(i => ids.has(i.id) ? { ...i, ...f } : i) };
    }
    case "BULK_UPDATE_RECEITA_PROJECAO": {
      const ids = new Set(action.payload.ids);
      const f = action.payload.fields;
      return { ...state, receitasProjecoes: state.receitasProjecoes.map(r => ids.has(r.id) ? { ...r, ...f } : r) };
    }
    case "BULK_UPDATE_RECEITA_REALIZACAO": {
      const ids = new Set(action.payload.ids);
      const f = action.payload.fields;
      return { ...state, receitasRealizacoes: state.receitasRealizacoes.map(r => ids.has(r.id) ? { ...r, ...f } : r) };
    }
    case "BULK_UPDATE_DESPESA": {
      const ids = new Set(action.payload.ids);
      const f = action.payload.fields;
      return { ...state, despesas: state.despesas.map(d => ids.has(d.id) ? { ...d, ...f } : d) };
    }
    case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ============= Derived calculations =============

export interface CalcirDerived {
  totalReceitasProjecoesPF: number;
  totalReceitasProjecoesPJ: number;
  totalReceitasRealizadasPF: number;
  totalReceitasRealizadasPJ: number;
  totalVendasImobilizadoPF: number;
  totalVendasImobilizadoPJ: number;
  totalReceitasPF: number;
  totalReceitasPJ: number;
  totalReceitasGeral: number;
  receitasRealizadas: number;
  receitasProjetadas: number;
  totalDespesasRealizadas: number;
  totalDespesasARealizar: number;
  totalDespesas: number;
  totalImobilizadoAquisicao: number;
  totalDespesasCreditoCheia: number;
  totalDespesasCreditoReducao60: number;
  totalDespesasSemCredito: number;
  totalCreditoDiesel: number;
  totalCreditoSimplesNacional: number;
  totalDespesasDiesel: number;
  totalDespesasSimplesNacional: number;
  totalDespesasPF: number;
  totalDespesasPJ: number;
  resultadoPF: number;
  impostosPJ: ImpostosPJ;
  trimestresPJ: TrimestrePJ[];
  distribuicaoDividendos: DistribuicaoDividendos;
  resultadosParceiros: ResultadoParceiro[];
  totalIRPF: number;
  irpfExclusivoPF: number;
  funruralPF: number;
  totalImpostosPFExclusivo: number;
  totalImpostosHoldingComparativo: number;
  totalImpostosHoldingCompleto: number;
  impostoDividendosExcedente: number;
  irpfGlobalPura: number;
  funruralGlobalPura: number;
  impostosPFPuraGlobal: number;
  economia: { antes: number; depois: number; economia: number; percentual: number };
  sugestaoRegimeFunrural: {
    regime: "receita_bruta" | "folha";
    economia: number;
    folhaZerada: boolean;
    custoNaVenda: number;
    custoNaFolha: number;
  };
  sugestaoRegimeFunruralPF: {
    regime: "receita_bruta" | "folha";
    economia: number;
    folhaZerada: boolean;
    custoNaVenda: number;
    custoNaFolha: number;
  };
  irpfmParceiros: Array<{
    parceiro: string;
    parceiroId: string;
    baseIRPFM: number;
    baseTabelaProgressiva: number;
    lucrosIsentos: number;
    rendaGlobalLiquida: number;
    aliquota: number;
    impostoBruto: number;
    impostoTabelaProgressiva: number;
    impostoDevido: number;
    regraVencedora: "tabela_progressiva" | "rampa_minima";
    retencaoDividendos10: number;
    irrfParticulares: number;
    irPagoRetido: number;
    irpfmDevido: number;
    irRestituir: number;
  }>;
  retencaoFonteParceiros: Array<{
    parceiro: string;
    percentual: number;
    valorBruto: number;
    retencao10: number;
    valorLiquido: number;
  }>;
  receitasMensaisPJ: number[];
}

export function computeDerived(state: CalcirState): CalcirDerived {
  const totalReceitasProjecoesPF = state.receitasProjecoes.filter(r => r.entidade === "PF").reduce((s, r) => s + r.total, 0);
  const totalReceitasProjecoesPJ = state.receitasProjecoes.filter(r => r.entidade === "PJ").reduce((s, r) => s + r.total, 0);
  const totalReceitasRealizadasPF = state.receitasRealizacoes.filter(r => r.entidade === "PF").reduce((s, r) => s + r.total, 0);
  const totalReceitasRealizadasPJ = state.receitasRealizacoes.filter(r => r.entidade === "PJ").reduce((s, r) => s + r.total, 0);
  const totalVendasImobilizadoPF = state.vendasImobilizado.filter(v => v.entidade === "PF").reduce((s, v) => s + v.total, 0);
  const totalVendasImobilizadoPJ = state.vendasImobilizado.filter(v => v.entidade === "PJ").reduce((s, v) => s + v.total, 0);
  
  const totalReceitasPF = totalReceitasRealizadasPF + totalReceitasProjecoesPF + totalVendasImobilizadoPF;
  const totalReceitasPJ = totalReceitasRealizadasPJ + totalReceitasProjecoesPJ + totalVendasImobilizadoPJ;
  const totalReceitasGeral = totalReceitasPF + totalReceitasPJ;
  const receitasRealizadas = totalReceitasRealizadasPF + totalReceitasRealizadasPJ;
  const receitasProjetadas = totalReceitasProjecoesPF + totalReceitasProjecoesPJ;

  const totalDespesasOperacionaisRealizadas = state.despesas.reduce((s, d) => s + d.realizado, 0);
  const totalDespesasOperacionaisARealizar = state.despesas.reduce((s, d) => s + d.aRealizar, 0);
  const totalImobilizadoAquisicaoRealizado = state.imobilizadoAquisicao.reduce((s, i) => s + i.realizado, 0);
  const totalImobilizadoAquisicaoARealizar = state.imobilizadoAquisicao.reduce((s, i) => {
    const realizado = Number(i.realizado) || 0;
    const aRealizar = Number(i.aRealizar) || 0;
    const total = Number(i.total) || 0;
    if (realizado === 0 && aRealizar === 0 && total > 0) {
      return s + total;
    }
    return s + aRealizar;
  }, 0);
  const totalDespesasRealizadas = totalDespesasOperacionaisRealizadas + totalImobilizadoAquisicaoRealizado;
  const totalDespesasARealizar = totalDespesasOperacionaisARealizar + totalImobilizadoAquisicaoARealizar;
  const totalDespesas = totalDespesasRealizadas + totalDespesasARealizar;
  const totalImobilizadoAquisicao = state.imobilizadoAquisicao.reduce((s, i) => s + i.total, 0);
  const totalDespesasCreditoCheia = state.despesas.filter(d => d.creditoIBSCBS === "cheia").reduce((s, d) => s + d.total, 0);
  const totalDespesasCreditoReducao60 = state.despesas.filter(d => d.creditoIBSCBS === "reducao60").reduce((s, d) => s + d.total, 0);
  // Diesel: crédito baseado em quantidade × alíquota R$/litro
  const totalDespesasDiesel = state.despesas.filter(d => d.creditoIBSCBS === "diesel").reduce((s, d) => s + d.total, 0);
  const totalCreditoDiesel = state.despesas
    .filter(d => d.creditoIBSCBS === "diesel")
    .reduce((s, d) => s + (d.quantidadeLitros || 0) * state.aliquotaDieselPorLitro, 0);

  // Simples Nacional: crédito baseado em valor × percentual informado pelo consultor (da NF do fornecedor)
  const totalDespesasSimplesNacional = state.despesas.filter(d => d.creditoIBSCBS === "simples_nacional").reduce((s, d) => s + d.total, 0);
  const totalCreditoSimplesNacional = state.despesas
    .filter(d => d.creditoIBSCBS === "simples_nacional")
    .reduce((s, d) => s + d.total * ((d.percentualCreditoSN || 0) / 100), 0);

  // Sem crédito: apenas os que realmente não têm nenhuma forma de crédito
  const totalDespesasSemCredito = state.despesas
    .filter(d => !d.creditoIBSCBS || d.creditoIBSCBS === "sem_credito")
    .reduce((s, d) => s + d.total, 0);

  let totalDespesasPF = 
    state.despesas.filter(d => d.entidade === "PF").reduce((s, d) => s + d.total, 0) + 
    state.imobilizadoAquisicao.filter(i => i.entidade === "PF").reduce((s, i) => s + i.total, 0);
    
  let totalDespesasPJ = 
    state.despesas.filter(d => d.entidade === "PJ").reduce((s, d) => s + d.total, 0) + 
    state.imobilizadoAquisicao.filter(i => i.entidade === "PJ").reduce((s, i) => s + i.total, 0);

  if (typeof state.simulacaoDespesasPFPerc === "number") {
    const totalDespesasAgregado = totalDespesasPF + totalDespesasPJ;
    totalDespesasPF = totalDespesasAgregado * (state.simulacaoDespesasPFPerc / 100);
    totalDespesasPJ = totalDespesasAgregado * ((100 - state.simulacaoDespesasPFPerc) / 100);
  }

  const lcdprLimite = Number.isFinite(state.lcdprLimite) && state.lcdprLimite > 0 ? state.lcdprLimite : 4800000;
  const lcdprObrigatorio = !state.contabilidadeRegular && totalReceitasPF > lcdprLimite;

  const resultadoPF = totalReceitasPF - totalDespesasPF;

  const allPJReceitas = [...state.receitasProjecoes, ...state.receitasRealizacoes].filter(r => r.entidade === "PJ");
  const receitasMensaisPJ = MESES.map((mes) =>
    allPJReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.total, 0)
  );
  // Trava de negócio: se folha = 0, força comercialização independentemente da escolha
  const funruralRegimeEfetivo: FunruralPJRegime = state.folhaPagamentoPJ === 0 ? "receita_bruta" : state.funruralPJRegime;

  // Receitas PJ com incidência de Funrural (exclui exportações, criação de animais, etc.)
  const receitasMensaisPJFunrural = MESES.map((mes) =>
    allPJReceitas.filter(r => r.mes === mes && !r.funruralNaoIncidente).reduce((s, r) => s + r.total, 0)
  );

  const trimestresPJ = calcularTrimestresPJ(receitasMensaisPJ, {
    regime: funruralRegimeEfetivo,
    aliquota: state.funruralPJAliquota,
    folhaPagamentoAnual: state.folhaPagamentoPJ,
    funruralBaseMensal: receitasMensaisPJFunrural,
  });
  
  const faturamentoComPisCofins = allPJReceitas.filter(r => r.pisCofins).reduce((s, r) => s + r.total, 0);
  const pis = faturamentoComPisCofins * 0.0065;
  const cofins = faturamentoComPisCofins * 0.03;
  
  const totalIR15 = trimestresPJ.reduce((s, t) => s + t.ir15, 0);
  const totalIRAdicional = trimestresPJ.reduce((s, t) => s + t.irAdicional, 0);
  const totalCSLL = trimestresPJ.reduce((s, t) => s + t.csll9, 0);
  const totalFunrural = trimestresPJ.reduce((s, t) => s + t.funrural, 0);
  const faturamentoTotal = trimestresPJ.reduce((s, t) => s + t.faturamento, 0);
  const diferencaFunrural055 = calcularDiferencaFunrural(faturamentoTotal, state.funruralPJRegime);

  const impostosPJ: ImpostosPJ = {
    faturamentoSemPisCofins: faturamentoTotal - faturamentoComPisCofins,
    faturamentoComPisCofins,
    faturamentoTotal,
    baseCalculoIR: faturamentoTotal * 0.08,
    baseCalculoCSLL: faturamentoTotal * 0.12,
    ir15: totalIR15,
    irAdicional10: totalIRAdicional,
    csll9: totalCSLL,
    funrural: totalFunrural,
    diferencaFunrural055,
    pis,
    cofins,
    // diferencaFunrural055 é INFORMATIVA — não entra no total (PJ paga 2,05% vs PF 1,50%)
    totalImpostos: totalIR15 + totalIRAdicional + totalCSLL + totalFunrural + pis + cofins,
  };

  const totalDespesasConsideradasPJ = state.demaisDespesasPJ + totalDespesasPJ;

  const distribuicaoDividendos = calcularDistribuicaoDividendos(
    totalReceitasRealizadasPJ,
    impostosPJ.totalImpostos,
    totalDespesasConsideradasPJ,
    state.lucroAcumuladoPJ,
  );

  const totalReceitaPJMensal = receitasMensaisPJ.reduce((s, v) => s + v, 0);
  const despesaMensalPJ = totalDespesasConsideradasPJ / 12;
  const distribuicoesMensaisPJ = receitasMensaisPJ.map((receita) => {
    if (totalReceitaPJMensal <= 0) return 0;
    const impostoMes = (receita / totalReceitaPJMensal) * impostosPJ.totalImpostos;
    const distribuicao = receita - despesaMensalPJ - impostoMes;
    return distribuicao > 0 ? distribuicao : 0;
  });

  const resultadosParceiros = state.parceiros.map(p => {
    const atividade = state.atividadeRuralParticular.find(a => a.parceiroId === p.id);
    const recParticular = atividade ? atividade.receitas.reduce((s, v) => s + v, 0) : 0;
    const despParticular = atividade ? atividade.despesas.reduce((s, v) => s + v, 0) : 0;
    const prejuizoAnterior = state.prejuizosAnteriores[p.id] || 0;
    const regimeApuracao = state.regimeApuracaoRural[p.id] || "automatico";
    return calcularResultadoParceiro(p.id, p.nome, p.participacao, p.participacao, totalReceitasPF, totalDespesasPF, recParticular, despParticular, prejuizoAnterior, regimeApuracao, lcdprObrigatorio);
  });

  const resultadosParceirosComIR = resultadosParceiros.map((rp) => {
    const regimeApuracao = state.regimeApuracaoRural[rp.parceiroId] || "automatico";
    const baseResultado = rp.baseCalculo;
    const baseArbitramento = rp.baseArbitramento;
    let regimeEfetivo: "resultado" | "arbitramento";

    if (lcdprObrigatorio) {
      regimeEfetivo = "arbitramento";
    } else if (regimeApuracao === "automatico") {
      regimeEfetivo = baseArbitramento <= baseResultado ? "arbitramento" : "resultado";
    } else {
      regimeEfetivo = regimeApuracao;
    }

    const baseTributavel = regimeEfetivo === "arbitramento" ? baseArbitramento : baseResultado;
    const { imposto } = calcularIRPF(baseTributavel);
    return {
      ...rp,
      regimeApuracao,
      regimeEfetivo,
      baseTributavel,
      irpfCalculado: imposto,
    };
  });

  const totalIRPF = resultadosParceirosComIR.reduce((s, r) => s + r.irpfCalculado, 0);

  // Impostos PF considerando apenas receitas classificadas como PF.
  // Funrural PF = 1,50% (sub-rogação padrão PF)
  const participacoes = state.parceiros.map(p => p.participacao);
  const regimesPFPuro: RegimeApuracaoRural[] = state.parceiros.map(
    (p) => state.regimeApuracaoRural[p.id] || "automatico",
  );
  const irpfExclusivoPF = calcularIRPFExclusivoPF(
    totalReceitasPF,
    totalDespesasPF,
    participacoes,
    regimesPFPuro,
    lcdprObrigatorio,
  );
  // Funrural PF: respeita regime escolhido, com trava se folha = 0
  const funruralPFRegimeEfetivo: FunruralPJRegime = state.folhaPagamentoPF === 0 ? "receita_bruta" : state.funruralPFRegime;
  // Base PF com incidência de Funrural (exclui receitas com funruralNaoIncidente)
  const allPFReceitas = [...state.receitasProjecoes, ...state.receitasRealizacoes].filter(r => r.entidade === "PF");
  const totalReceitasPFFunrural = allPFReceitas.filter(r => !r.funruralNaoIncidente).reduce((s, r) => s + r.total, 0) + totalVendasImobilizadoPF;
  const funruralPF = funruralPFRegimeEfetivo === "folha"
    ? state.folhaPagamentoPF * 0.288
    : totalReceitasPFFunrural * state.funruralPFAliquota;
  const totalImpostosPFExclusivo = irpfExclusivoPF + funruralPF;
  const totalImpostosHoldingComparativo = totalIRPF + impostosPJ.totalImpostos;

  // --- IRPFM sobre Excedente Presumido para Holding (sem Contabilidade Regular) ---
  const lucroLiquidoRealPJ = impostosPJ.faturamentoTotal - impostosPJ.totalImpostos - totalDespesasConsideradasPJ;
  
  // Refinamento IN 1.700/2017: O limite isento real (sem contabilidade) é a Margem de Presunção subtraída dos impostos federais pagos
  const impostosFederaisPJ = impostosPJ.ir15 + impostosPJ.irAdicional10 + impostosPJ.csll9 + impostosPJ.pis + impostosPJ.cofins;
  const limiteIsentoPresumidoPJ = Math.max(0, (impostosPJ.faturamentoTotal * 0.08) - impostosFederaisPJ);
  
  const impostoDividendosExcedente = !state.contabilidadeRegular && lucroLiquidoRealPJ > limiteIsentoPresumidoPJ 
    ? (lucroLiquidoRealPJ - limiteIsentoPresumidoPJ) * 0.10 
    : 0;

  // A Renda Líquida a distribuir é o Lucro Real após todos os impostos (incluindo o imposto excedente, se aplicável)
  const lucroDistribuivelPJ = Math.max(0, lucroLiquidoRealPJ - impostoDividendosExcedente);

  const retencaoFonteParceiros = state.parceiros.map(p => {
    // Calculamos qual a fatia do imposto "multa" excedente pertence a esse sócio com base na participação
    const retencaoMulta = impostoDividendosExcedente * (p.participacao / 100);
    const distribuicaoBruta = lucroDistribuivelPJ * (p.participacao / 100);
    return { parceiro: p.nome, percentual: p.participacao, valorBruto: distribuicaoBruta, retencao10: retencaoMulta, valorLiquido: distribuicaoBruta - retencaoMulta };
  });

  const irpfmParceiros = state.parceiros.map((p, i) => {
    const ret = retencaoFonteParceiros[i];
    const rp = resultadosParceirosComIR[i];
    const baseRural = rp.baseTributavel;

    // 2) Rendimentos Particulares (pró-labore, aluguéis, dividendos externos, etc.)
    const rendParticulares = state.rendimentosParticulares.find(r => r.parceiroId === p.id);
    const totalDividendosParticulares = rendParticulares
      ? [...rendParticulares.dividendos].reduce((s, v) => s + v, 0)
      : 0;
    const totalRendimentosTributaveisParticulares = rendParticulares
      ? [...rendParticulares.alugueis, ...rendParticulares.proLabore, ...rendParticulares.rendAplicacoes, ...rendParticulares.ganhoCapital].reduce((s, v) => s + v, 0)
      : 0;

    // 3) Dividendos da PJ (distribuição holding baseada na sua participação real)
    const dividendosPJ = ret.valorBruto;

    // Renda Global IRPFM = Rural + Rendimentos Tributáveis + Dividendos (PJ + particulares)
    const rendaGlobal = baseRural + totalRendimentosTributaveisParticulares + totalDividendosParticulares + dividendosPJ;

    // Base da tabela progressiva: exclui dividendos (tributados no pedágio IRPFM)
    const baseTabelaProgressiva = baseRural + totalRendimentosTributaveisParticulares;

    // Retenções na fonte: retenção 10% dividendos (excedente retido na PJ) + retenções particulares (IRRF)
    const retParticulares = state.retencoesParticulares.find(r => r.parceiroId === p.id);
    const totalRetencoesParticulares = retParticulares ?
      [...retParticulares.irrfDividendos, ...retParticulares.irrfAlugueis, ...retParticulares.irrfProLabore,
       ...retParticulares.irrfRendAplicacoes, ...retParticulares.irrfOperacoesBolsa].reduce((s, v) => s + v, 0) : 0;
    const retencaoDividendos10 = ret.retencao10;
    const irrfParticulares = totalRetencoesParticulares;
    const retencoesFonte = ret.retencao10 + irrfParticulares;

    // Lucros isentos: inclui o histórico de isenções e os dividendos isentos (se tiver contabilidade regular)
    const lucroIsentoHistorico = state.lucrosIsentosAcumulados[p.id] || 0;
    const dividendosIsentosPJ = state.contabilidadeRegular ? dividendosPJ : 0;
    const lucrosIsentos = lucroIsentoHistorico + dividendosIsentosPJ;

    const calculo = calcularIRPFM(rendaGlobal, retencoesFonte, lucrosIsentos, baseTabelaProgressiva);
    const regraVencedora: "tabela_progressiva" | "rampa_minima" =
      calculo.impostoTabelaProgressiva >= calculo.impostoBruto ? "tabela_progressiva" : "rampa_minima";
    return {
      parceiro: p.nome,
      parceiroId: p.id,
      ...calculo,
      regraVencedora,
      retencaoDividendos10: ret.retencao10,
      irrfParticulares,
    };
  });

  const totalIRPFM = irpfmParceiros.reduce((s, p) => s + p.irpfmDevido, 0);
  const irpfmExtra = Math.max(0, totalIRPFM - totalIRPF);

  // MÁGICA: Zera o IRPFM Normal inteiro se houver Contabilidade Regular
  const irpfmEfetivo = irpfmExtra * (state.contabilidadeRegular ? 0 : 1);

  // Cenário Global (100% PF Pura)
  const lcdprObrigatorioGlobal = !state.contabilidadeRegular && totalReceitasGeral > lcdprLimite;
  const irpfGlobalPura = calcularIRPFExclusivoPF(
    totalReceitasGeral,
    totalDespesas,
    participacoes,
    regimesPFPuro,
    lcdprObrigatorioGlobal
  );
  // Cenário PF Pura Global: respeita o regime de Funrural selecionado para PF
  // Base global com incidência (exclui não-incidentes de ambas entidades)
  const totalReceitasGeralFunrural = [...state.receitasProjecoes, ...state.receitasRealizacoes]
    .filter(r => !r.funruralNaoIncidente).reduce((s, r) => s + r.total, 0) + totalVendasImobilizadoPF + totalVendasImobilizadoPJ;
  const funruralGlobalPura = funruralPFRegimeEfetivo === "folha"
    ? state.folhaPagamentoPF * 0.288
    : totalReceitasGeralFunrural * state.funruralPFAliquota;
  const impostosPFPuraGlobal = irpfGlobalPura + funruralGlobalPura;

  const economia = calcularEconomia(
    impostosPFPuraGlobal, 
    totalIRPF, 
    impostosPJ.totalImpostos, 
    irpfmEfetivo + impostoDividendosExcedente + funruralPF
  );
  // O Total é a base PJ + PF Remanescente + IRPFM da Rampa + Multa Excedente + Funrural PF
  const totalImpostosHoldingCompleto = totalImpostosHoldingComparativo + irpfmEfetivo + impostoDividendosExcedente + funruralPF;

  const custoFunruralVenda = impostosPJ.faturamentoTotal * state.funruralPJAliquota;
  const custoFunruralFolha = state.folhaPagamentoPJ * 0.288;
  const folhaZerada = state.folhaPagamentoPJ === 0;
  const sugestaoRegimeFunrural = {
    regime: (folhaZerada ? "receita_bruta" : (custoFunruralFolha < custoFunruralVenda ? "folha" : "receita_bruta")) as "receita_bruta" | "folha",
    economia: folhaZerada ? 0 : Math.abs(custoFunruralVenda - custoFunruralFolha),
    folhaZerada,
    custoNaVenda: custoFunruralVenda,
    custoNaFolha: custoFunruralFolha,
  };

  // Sugestão Funrural PF
  const custoFunruralPFVenda = totalReceitasPF * state.funruralPFAliquota;
  const custoFunruralPFFolha = state.folhaPagamentoPF * 0.288;
  const folhaPFZerada = state.folhaPagamentoPF === 0;
  const sugestaoRegimeFunruralPF = {
    regime: (folhaPFZerada ? "receita_bruta" : (custoFunruralPFFolha < custoFunruralPFVenda ? "folha" : "receita_bruta")) as "receita_bruta" | "folha",
    economia: folhaPFZerada ? 0 : Math.abs(custoFunruralPFVenda - custoFunruralPFFolha),
    folhaZerada: folhaPFZerada,
    custoNaVenda: custoFunruralPFVenda,
    custoNaFolha: custoFunruralPFFolha,
  };

  return {
    totalReceitasProjecoesPF, totalReceitasProjecoesPJ,
    totalReceitasRealizadasPF, totalReceitasRealizadasPJ,
    totalVendasImobilizadoPF, totalVendasImobilizadoPJ,
    totalReceitasPF, totalReceitasPJ, totalReceitasGeral,
    receitasRealizadas, receitasProjetadas,
    totalDespesasRealizadas, totalDespesasARealizar, totalDespesas,
    totalImobilizadoAquisicao,
    totalDespesasCreditoCheia, totalDespesasCreditoReducao60, totalDespesasSemCredito,
    totalCreditoDiesel, totalCreditoSimplesNacional, totalDespesasDiesel, totalDespesasSimplesNacional,
    totalDespesasPF, totalDespesasPJ,
    resultadoPF, impostosPJ, trimestresPJ,
    distribuicaoDividendos, resultadosParceiros: resultadosParceirosComIR, totalIRPF,
    irpfExclusivoPF, funruralPF, totalImpostosPFExclusivo,
    totalImpostosHoldingComparativo, totalImpostosHoldingCompleto,
    impostoDividendosExcedente,
    irpfGlobalPura, funruralGlobalPura, impostosPFPuraGlobal,
    economia,
    sugestaoRegimeFunrural,
    sugestaoRegimeFunruralPF,
    irpfmParceiros, retencaoFonteParceiros, receitasMensaisPJ
  };
}

// ============= Context =============

interface CalcirContextType {
  state: CalcirState;
  derived: CalcirDerived;
  dispatch: React.Dispatch<Action>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadFromDB: (clienteId: string) => Promise<void>;
  clienteId: string | null;
  setClienteId: (id: string | null) => void;
  analises: CalcirAnalise[];
  analiseId: string | null;
  analiseBasePadraoId: string | null;
  analisesLoading: boolean;
  setAnaliseId: (id: string | null) => void;
  refreshAnalises: () => Promise<void>;
  createAnalise: (input: {
    nome: string;
    tipo: "base" | "consolidada";
    descricao?: string | null;
    anoReferencia?: number | null;
    isBasePadrao?: boolean;
  }) => Promise<void>;
  updateAnalise: (
    analiseId: string,
    updates: {
      nome?: string;
      descricao?: string | null;
      status?: "rascunho" | "fechada" | "arquivada";
      anoReferencia?: number | null;
      isBasePadrao?: boolean;
    },
  ) => Promise<void>;
  deleteAnalise: (analiseId: string) => Promise<void>;
  duplicateAnalise: (analiseId: string, nome?: string) => Promise<void>;
  setBasePadrao: (analiseId: string) => Promise<void>;
  getAnaliseOrigens: (analiseConsolidadaId: string) => Promise<CalcirAnaliseOrigem[]>;
  saveAnaliseOrigens: (analiseConsolidadaId: string, origens: CalcirAnaliseOrigem[]) => Promise<void>;
  selectedParceiroId: string | null;
  setSelectedParceiroId: (id: string | null) => void;
  conflictDetected: boolean;
  resolveConflict: (action: "reload" | "overwrite" | "cancel") => void;
}

const CalcirContext = createContext<CalcirContextType | null>(null);

const SAVE_DEBOUNCE_MS = 2000;
const CRITICAL_SAVE_ACTIONS = new Set<Action["type"]>([
  "UPDATE_PARCEIRO",
  "DELETE_PARCEIRO",
  "DELETE_RECEITA_PROJECAO",
  "DELETE_RECEITA_REALIZACAO",
  "DELETE_DESPESA",
  "DELETE_VENDA_IMOBILIZADO",
  "DELETE_IMOBILIZADO_AQUISICAO",
  "BULK_DELETE_RECEITA_PROJECAO",
  "BULK_DELETE_RECEITA_REALIZACAO",
  "BULK_DELETE_DESPESA",
  "BULK_DELETE_VENDA_IMOBILIZADO",
  "BULK_DELETE_IMOBILIZADO_AQUISICAO",
]);

export function CalcirProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatchBase] = useReducer(reducer, initialState);
  const derived = useMemo(() => computeDerived(state), [state]);
  const storedClienteId = sessionStorage.getItem("calcir_cliente_id");
  const storedAnaliseId = sessionStorage.getItem("calcir_analise_id");
  const [loading, setLoading] = useState(!!storedClienteId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteId, setClienteIdRaw] = useState<string | null>(storedClienteId);
  const [analiseId, setAnaliseIdRaw] = useState<string | null>(storedAnaliseId);
  const [analiseBasePadraoId, setAnaliseBasePadraoId] = useState<string | null>(null);
  const [analises, setAnalises] = useState<CalcirAnalise[]>([]);
  const [selectedParceiroId, setSelectedParceiroId] = useState<string | null>(null);
  const [analisesLoading, setAnalisesLoading] = useState(false);
  const [legacyMode, setLegacyMode] = useState(false);
  const [cowScenarioMode, setCowScenarioMode] = useState(false);

  const setClienteId = useCallback((id: string | null) => {
    if (id) {
      sessionStorage.setItem("calcir_cliente_id", id);
    } else {
      sessionStorage.removeItem("calcir_cliente_id");
      sessionStorage.removeItem("calcir_analise_id");
      setAnaliseIdRaw(null);
      setAnalises([]);
      setAnaliseBasePadraoId(null);
      setLegacyMode(false);
      lastSavedSnapshotRef.current = null;
      dispatch({ type: "SET_STATE", payload: initialState });
    }
    setClienteIdRaw(id);
  }, []);

  const setAnaliseId = useCallback((id: string | null) => {
    if (id) {
      sessionStorage.setItem("calcir_analise_id", id);
    } else {
      sessionStorage.removeItem("calcir_analise_id");
    }

    // ── Prevent race condition: cancel pending auto-save and block new
    //    saves until the new analysis finishes loading. Without this,
    //    stale data from the previous analysis can be written to the
    //    newly-selected analysis's storage (especially dangerous when
    //    switching FROM a scenario TO the base, as it corrupts the
    //    structured tables). ──
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setLoaded(false);
    lastSavedSnapshotRef.current = null;

    setAnaliseIdRaw(id);
  }, []);

  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActionTypeRef = useRef<Action["type"] | null>(null);
  const stateRef = useRef(state);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const analiseBasePadraoIdRef = useRef<string | null>(null);
  const receitaCowMetaRef = useRef<Record<string, { sourceId: string; rowVersion: number; isOverride: boolean }>>({});
  const despesaCowMetaRef = useRef<Record<string, { sourceId: string; rowVersion: number; isOverride: boolean }>>({});
  // Optimistic locking: watermark and conflict state
  const dataWatermarkRef = useRef<string | null>(null);
  const pendingOverwriteRef = useRef<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);
  // Generation counter: incremented every time a new load starts.
  // Each loadFromDB captures its generation at the start and discards
  // results if a newer load has since been initiated, preventing stale
  // data from a previous analysis from overwriting the current one.
  const loadGenerationRef = useRef(0);
  stateRef.current = state;
  analiseBasePadraoIdRef.current = analiseBasePadraoId;

  const dispatch = useCallback((action: Action) => {
    lastActionTypeRef.current = action.type;
    dispatchBase(action);
  }, []);

  const serializeSnapshot = useCallback((snapshotState: CalcirState) => {
    try {
      return JSON.stringify(snapshotState);
    } catch {
      return null;
    }
  }, []);

  const indexById = useCallback(<T extends { id: string }>(items: T[]) => {
    return new Map(items.map((item) => [item.id, item]));
  }, []);

  const sameItem = useCallback((left: unknown, right: unknown) => {
    return JSON.stringify(left) === JSON.stringify(right);
  }, []);

  const refreshAnalisesInternal = useCallback(async (id: string) => {
    setAnalisesLoading(true);
    try {
      const ensured = await ensureCalcirBasePadrao(id);
      setLegacyMode(false);
      setAnalises(ensured.analises);
      setAnaliseBasePadraoId(ensured.basePadraoId);

      const preferredAnalise = analiseId && ensured.analises.some((a) => a.id === analiseId)
        ? analiseId
        : ensured.basePadraoId;
      setAnaliseId(preferredAnalise);
    } catch (err: any) {
      const details = `${err?.message || ""} ${err?.details || ""} ${err?.hint || ""}`.toLowerCase();
      const schemaMissing =
        details.includes("calcir_analises") ||
        details.includes("pgrst205") ||
        details.includes("schema cache") ||
        details.includes("404");

      if (schemaMissing) {
        setLegacyMode(true);
        setAnalises([]);
        setAnaliseBasePadraoId(null);
        setAnaliseId(null);
      } else {
        throw err;
      }
    } finally {
      setAnalisesLoading(false);
    }
  }, [analiseId, setAnaliseId]);

  const refreshAnalises = useCallback(async () => {
    if (!clienteId) return;
    await refreshAnalisesInternal(clienteId);
  }, [clienteId, refreshAnalisesInternal]);

  const loadFromDB = useCallback(async (id: string) => {
    // Capture this load's generation. Any state mutations are only applied
    // if no newer load has started in the meantime (prevents data mixing
    // when switching analyses in rapid succession).
    const myGeneration = ++loadGenerationRef.current;

    if (!legacyMode && !analiseId) {
      setLoaded(false);
      setLoading(false);
      return;
    }

    // Always block auto-save while loading new data, and show spinner
    setLoaded(false);
    setLoading(true);
    setError(null);
    setCowScenarioMode(false);
    receitaCowMetaRef.current = {};
    despesaCowMetaRef.current = {};
    try {
      const isBase = legacyMode || analiseId === analiseBasePadraoIdRef.current;

      if (isBase) {
        // ── Base analysis: structured tables are the source of truth ──
        // This ensures data from Connectere/Aegro syncs is always reflected.
        const structuredData = await loadClientData(id);
        if (loadGenerationRef.current !== myGeneration) return; // stale load
        if (structuredData) {
          dispatch({ type: "SET_STATE", payload: structuredData });
          lastSavedSnapshotRef.current = serializeSnapshot(structuredData);
          // Sync the blob cache so it stays consistent with structured tables
          if (analiseId) {
            saveCalcirAnalisePayload(id, analiseId, structuredData).catch(
              (err) => console.warn("Blob cache sync (non-critical):", err)
            );
          }
        } else {
          dispatch({ type: "SET_STATE", payload: initialState });
          lastSavedSnapshotRef.current = serializeSnapshot(initialState);
        }
        // Store watermark for optimistic locking
        getFarmDataWatermark(id).then((w) => { dataWatermarkRef.current = w; }).catch(() => {});
        setLoaded(true);
        return;
      }

      // ── Non-base (scenario) analysis: JSON payload is the source ──
      const cowEnabled = await isCalcirCowEnabled(id);
      if (loadGenerationRef.current !== myGeneration) return; // stale load
      if (cowEnabled) {
        try {
          const [payloadData, baseData, receitasEfetivas, despesasEfetivas] = await Promise.all([
            loadCalcirAnalisePayload(id, analiseId),
            loadClientData(id),
            loadCalcirReceitasEfetivas(id, analiseId),
            loadCalcirDespesasEfetivas(id, analiseId),
          ]);
          if (loadGenerationRef.current !== myGeneration) return; // stale load

          const scaffold = payloadData ?? baseData ?? initialState;

          const receitasProjecoes: ReceitaItem[] = [];
          const receitasRealizacoes: ReceitaItem[] = [];
          const receitasMeta: Record<string, { sourceId: string; rowVersion: number; isOverride: boolean }> = {};
          const receitaEffectiveIds = new Set<string>();

          for (const row of receitasEfetivas) {
            const isReceitaRealizada = row.tipo === "realizado" || row.tipo === "realizacao";
            const mapped: ReceitaItem = {
              id: row.source_id,
              produto: row.produto ?? "",
              obs: row.obs ?? "",
              entidade: row.entidade === "PF" ? "PF" : "PJ",
              pisCofins: !!row.pis_cofins,
              funruralNaoIncidente: !!(row as any).funrural_nao_incidente,
              estoque: Number((row as any).estoque ?? 0),
              mes: row.mes ?? "",
              quantidade: Number(row.quantidade ?? 0),
              valorUnit: Number(row.valor_unit ?? 0),
              total: Number(row.total ?? 0),
            };

            if (isReceitaRealizada) {
              receitasRealizacoes.push(mapped);
            } else {
              receitasProjecoes.push(mapped);
            }

            receitaEffectiveIds.add(mapped.id);

            receitasMeta[mapped.id] = {
              sourceId: row.source_id,
              rowVersion: Number(row.row_version ?? 1),
              isOverride: !!row.is_override,
            };
          }

          const shouldFallbackReceitasFromPayload = receitasEfetivas.length === 0;

          if (shouldFallbackReceitasFromPayload) {
            const payloadReceitasProjecoes = Array.isArray(payloadData?.receitasProjecoes)
              ? payloadData!.receitasProjecoes
              : [];
            const payloadReceitasRealizacoes = Array.isArray(payloadData?.receitasRealizacoes)
              ? payloadData!.receitasRealizacoes
              : [];

            for (const item of payloadReceitasProjecoes) {
              if (!item?.id || receitaEffectiveIds.has(item.id)) continue;
              receitasProjecoes.push(item);
            }

            for (const item of payloadReceitasRealizacoes) {
              if (!item?.id || receitaEffectiveIds.has(item.id)) continue;
              receitasRealizacoes.push(item);
            }
          }

          const despesas: DespesaItem[] = [];
          const despesasMeta: Record<string, { sourceId: string; rowVersion: number; isOverride: boolean }> = {};
          const despesaEffectiveIds = new Set<string>();

          for (const row of despesasEfetivas) {
            const mapped: DespesaItem = {
              id: row.source_id,
              descricao: row.descricao ?? "",
              obs: row.obs ?? "",
              entidade: ((row as any).entidade || "PJ") as "PF" | "PJ",
              totalAnoAnterior: Number(row.total_ano_anterior ?? 0),
              realizado: Number(row.realizado ?? 0),
              aRealizar: Number(row.a_realizar ?? 0),
              total: Number(row.total ?? 0),
              estoque: Number((row as any).estoque ?? 0),
              creditoIBSCBS: (row.credito_ibs_cbs as CreditoIBSCBS) || "sem_credito",
            };

            despesas.push(mapped);
            despesaEffectiveIds.add(mapped.id);
            despesasMeta[mapped.id] = {
              sourceId: row.source_id,
              rowVersion: Number(row.row_version ?? 1),
              isOverride: !!row.is_override,
            };
          }

          const shouldFallbackDespesasFromPayload = despesasEfetivas.length === 0;

          if (shouldFallbackDespesasFromPayload) {
            const payloadDespesas = Array.isArray(payloadData?.despesas)
              ? payloadData!.despesas
              : [];

            for (const item of payloadDespesas) {
              if (!item?.id || despesaEffectiveIds.has(item.id)) continue;
              despesas.push(item);
            }
          }

          const mergedState: CalcirState = {
            ...scaffold,
            receitasProjecoes,
            receitasRealizacoes,
            despesas,
          };

          receitaCowMetaRef.current = receitasMeta;
          despesaCowMetaRef.current = despesasMeta;
          setCowScenarioMode(true);
          dispatch({ type: "SET_STATE", payload: mergedState });
          lastSavedSnapshotRef.current = serializeSnapshot(mergedState);
          setLoaded(true);
          return;
        } catch (cowErr) {
          if (loadGenerationRef.current !== myGeneration) return; // stale load
          console.warn("Falha no dual-read COW, usando fallback legado:", cowErr);
        }
      }

      const payloadData = await loadCalcirAnalisePayload(id, analiseId);
      if (loadGenerationRef.current !== myGeneration) return; // stale load

      if (payloadData) {
        dispatch({ type: "SET_STATE", payload: payloadData });
        lastSavedSnapshotRef.current = serializeSnapshot(payloadData);
      } else {
        // New scenario with no payload yet — seed from structured tables
        const seedData = await loadClientData(id);
        if (loadGenerationRef.current !== myGeneration) return; // stale load
        if (seedData) {
          dispatch({ type: "SET_STATE", payload: seedData });
          await saveCalcirAnalisePayload(id, analiseId, seedData);
          lastSavedSnapshotRef.current = serializeSnapshot(seedData);
        } else {
          dispatch({ type: "SET_STATE", payload: initialState });
          lastSavedSnapshotRef.current = serializeSnapshot(initialState);
        }
      }
      if (loadGenerationRef.current !== myGeneration) return; // stale load
      setLoaded(true);
    } catch (err: any) {
      if (loadGenerationRef.current !== myGeneration) return; // stale load
      setError(err.message || "Erro ao carregar dados");
    } finally {
      if (loadGenerationRef.current === myGeneration) {
        setLoading(false);
      }
    }
  }, [analiseId, legacyMode, serializeSnapshot]);

  // Bootstrap analyses when clienteId changes
  useEffect(() => {
    if (!clienteId) {
      setLoaded(false);
      return;
    }

    refreshAnalisesInternal(clienteId).catch((err: any) => {
      setError(err?.message || "Erro ao carregar análises");
      setLoading(false);
    });
  }, [clienteId, refreshAnalisesInternal]);

  // Load analysis payload when cliente/analise changes.
  // IMPORTANT: We must wait for analiseBasePadraoId to be resolved before
  // loading, otherwise we can't tell if the current analysis is the base
  // (structured tables) or a scenario (JSON blob). Without this guard, on
  // initial load the base analysis would be loaded from the blob because
  // analiseBasePadraoId is still null, causing stale/corrupt data to appear.
  useEffect(() => {
    if (clienteId && (analiseId || legacyMode) && (legacyMode || analiseBasePadraoId !== null)) {
      loadFromDB(clienteId);
    }
  }, [clienteId, analiseId, analiseBasePadraoId, legacyMode, loadFromDB]);

  const persistCurrentState = useCallback(async (snapshotToSave: string) => {
    const isBase = legacyMode || analiseId === analiseBasePadraoIdRef.current;

    if (isBase) {
      // Optimistic locking: check if another user saved since we loaded
      if (dataWatermarkRef.current) {
        try {
          const serverWatermark = await getFarmDataWatermark(clienteId!);
          if (serverWatermark && serverWatermark > dataWatermarkRef.current) {
            // Conflict detected — store snapshot and wait for user decision
            pendingOverwriteRef.current = snapshotToSave;
            setConflictDetected(true);
            return;
          }
        } catch {
          // If watermark check fails, proceed with save (don't block work)
        }
      }

      let persistVendasImobilizado = true;
      let persistImobilizadoAquisicao = true;

      if (lastSavedSnapshotRef.current) {
        try {
          const previousState = JSON.parse(lastSavedSnapshotRef.current) as CalcirState;
          persistVendasImobilizado =
            JSON.stringify(previousState.vendasImobilizado) !== JSON.stringify(stateRef.current.vendasImobilizado);
          persistImobilizadoAquisicao =
            JSON.stringify(previousState.imobilizadoAquisicao) !== JSON.stringify(stateRef.current.imobilizadoAquisicao);
        } catch {
          persistVendasImobilizado = true;
          persistImobilizadoAquisicao = true;
        }
      }

      await saveClientData(clienteId!, stateRef.current, {
        persistVendasImobilizado,
        persistImobilizadoAquisicao,
      });
      // Update watermark after successful save
      getFarmDataWatermark(clienteId!).then((w) => { dataWatermarkRef.current = w; }).catch(() => {});

      if (!legacyMode && analiseId) {
        try {
          await saveCalcirAnalisePayload(clienteId!, analiseId, stateRef.current);
        } catch (cacheErr) {
          console.warn("Blob cache sync (non-critical):", cacheErr);
        }
      }
    } else {
      if (cowScenarioMode && lastSavedSnapshotRef.current) {
        const previousState = JSON.parse(lastSavedSnapshotRef.current) as CalcirState;
        const currentState = stateRef.current;

        const previousReceitas = [
          ...previousState.receitasProjecoes,
          ...previousState.receitasRealizacoes,
        ];
        const currentReceitas = [
          ...currentState.receitasProjecoes,
          ...currentState.receitasRealizacoes,
        ];

        const previousReceitasMap = indexById(previousReceitas);
        const currentReceitasMap = indexById(currentReceitas);

        for (const item of currentReceitas) {
          const previousItem = previousReceitasMap.get(item.id);
          const meta = receitaCowMetaRef.current[item.id];
          const receitaTipo = currentState.receitasRealizacoes.some((r) => r.id === item.id) ? "realizado" : "projecao";

          if (!previousItem) {
            if (!meta) {
              const created = await createReceitaCOW(
                clienteId!,
                analiseId!,
                item,
                receitaTipo,
              );

              receitaCowMetaRef.current[item.id] = {
                sourceId: created.source_id || item.id,
                rowVersion: Number(created.row_version ?? 1),
                isOverride: !!created.is_override,
              };
            }
            continue;
          }

          if (sameItem(previousItem, item)) {
            continue;
          }

          if (!meta) {
            const created = await createReceitaCOW(
              clienteId!,
              analiseId!,
              item,
              receitaTipo,
            );

            receitaCowMetaRef.current[item.id] = {
              sourceId: created.source_id || item.id,
              rowVersion: Number(created.row_version ?? 1),
              isOverride: !!created.is_override,
            };
            continue;
          }

          const result = await updateReceitaCOW(
            clienteId!,
            analiseId!,
            meta.sourceId,
            ({
              tipo: receitaTipo,
              produto: item.produto,
              obs: item.obs,
              entidade: item.entidade,
              pisCofins: item.pisCofins,
              pis_cofins: item.pisCofins,
              funruralNaoIncidente: item.funruralNaoIncidente,
              mes: item.mes,
              quantidade: item.quantidade,
              valorUnit: item.valorUnit,
              total: item.total,
            } as any),
            meta.rowVersion,
          );

          receitaCowMetaRef.current[item.id] = {
            sourceId: result.source_id || meta.sourceId || item.id,
            rowVersion: Number(result.row_version ?? meta.rowVersion + 1),
            isOverride: !!result.is_override,
          };
        }

        for (const previousItem of previousReceitas) {
          if (currentReceitasMap.has(previousItem.id)) continue;
          const meta = receitaCowMetaRef.current[previousItem.id];
          if (!meta) continue;

          await softDeleteReceitaCOW(
            clienteId!,
            analiseId!,
            meta.sourceId,
            meta.rowVersion,
          );

          delete receitaCowMetaRef.current[previousItem.id];
        }

        const previousDespesasMap = indexById(previousState.despesas);
        const currentDespesasMap = indexById(currentState.despesas);

        for (const item of currentState.despesas) {
          const previousItem = previousDespesasMap.get(item.id);
          const meta = despesaCowMetaRef.current[item.id];

          if (!previousItem) {
            if (!meta) {
              const created = await createDespesaCOW(
                clienteId!,
                analiseId!,
                item,
              );

              despesaCowMetaRef.current[item.id] = {
                sourceId: created.source_id || item.id,
                rowVersion: Number(created.row_version ?? 1),
                isOverride: !!created.is_override,
              };
            }
            continue;
          }

          if (sameItem(previousItem, item)) {
            continue;
          }

          if (!meta) {
            const created = await createDespesaCOW(
              clienteId!,
              analiseId!,
              item,
            );

            despesaCowMetaRef.current[item.id] = {
              sourceId: created.source_id || item.id,
              rowVersion: Number(created.row_version ?? 1),
              isOverride: !!created.is_override,
            };
            continue;
          }

          const result = await updateDespesaCOW(
            clienteId!,
            analiseId!,
            meta.sourceId,
            {
              descricao: item.descricao,
              obs: item.obs,
              totalAnoAnterior: item.totalAnoAnterior,
              realizado: item.realizado,
              aRealizar: item.aRealizar,
              total: item.total,
              creditoIBSCBS: item.creditoIBSCBS,
            },
            meta.rowVersion,
          );

          despesaCowMetaRef.current[item.id] = {
            sourceId: result.source_id || meta.sourceId || item.id,
            rowVersion: Number(result.row_version ?? meta.rowVersion + 1),
            isOverride: !!result.is_override,
          };
        }

        for (const previousItem of previousState.despesas) {
          if (currentDespesasMap.has(previousItem.id)) continue;
          const meta = despesaCowMetaRef.current[previousItem.id];
          if (!meta) continue;

          await softDeleteDespesaCOW(
            clienteId!,
            analiseId!,
            meta.sourceId,
            meta.rowVersion,
          );

          delete despesaCowMetaRef.current[previousItem.id];
        }
      }

      await saveCalcirAnalisePayload(clienteId!, analiseId!, stateRef.current);
    }

    lastSavedSnapshotRef.current = snapshotToSave;
  }, [analiseId, clienteId, cowScenarioMode, indexById, legacyMode, sameItem]);

  // Debounced auto-save
  useEffect(() => {
    if (!clienteId || (!legacyMode && !analiseId) || !loaded) return;

    const handlePersistError = (err: any) => {
      if (err?.code === "COW_VERSION_CONFLICT") {
        setError("Este item foi alterado em paralelo. Recarregamos os dados para evitar sobrescrita.");
        loadFromDB(clienteId).catch((reloadErr: any) => {
          console.error("Erro ao recarregar após conflito COW:", reloadErr);
        });
        return;
      }
      console.error("Auto-save error:", err);
    };

    const snapshotToSave = serializeSnapshot(state);
    if (!snapshotToSave) return;
    if (snapshotToSave === lastSavedSnapshotRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const shouldSaveImmediately = !!lastActionTypeRef.current && CRITICAL_SAVE_ACTIONS.has(lastActionTypeRef.current);

    if (shouldSaveImmediately) {
      persistCurrentState(snapshotToSave).catch(handlePersistError);
      lastActionTypeRef.current = null;
      return;
    }

    saveTimerRef.current = setTimeout(async () => {
      persistCurrentState(snapshotToSave).catch(handlePersistError);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, clienteId, analiseId, legacyMode, loaded, serializeSnapshot, persistCurrentState, loadFromDB]);

  const createAnalise = useCallback(async (input: {
    nome: string;
    tipo: "base" | "consolidada";
    descricao?: string | null;
    anoReferencia?: number | null;
    isBasePadrao?: boolean;
  }) => {
    if (!clienteId) return;
    const created = await createCalcirAnalise(clienteId, input);
    await refreshAnalisesInternal(clienteId);
    setAnaliseId(created.id);
  }, [clienteId, refreshAnalisesInternal, setAnaliseId]);

  const updateAnalise = useCallback(async (
    analysisId: string,
    updates: {
      nome?: string;
      descricao?: string | null;
      status?: "rascunho" | "fechada" | "arquivada";
      anoReferencia?: number | null;
      isBasePadrao?: boolean;
    },
  ) => {
    if (!clienteId) return;
    await updateCalcirAnalise(clienteId, analysisId, updates);
    await refreshAnalisesInternal(clienteId);
  }, [clienteId, refreshAnalisesInternal]);

  const removeAnalise = useCallback(async (analysisId: string) => {
    if (!clienteId) return;
    await deleteCalcirAnalise(clienteId, analysisId);
    await refreshAnalisesInternal(clienteId);
  }, [clienteId, refreshAnalisesInternal]);

  const duplicateAnalise = useCallback(async (analysisId: string, nome?: string) => {
    if (!clienteId) return;
    const duplicated = await duplicateCalcirAnalise(clienteId, analysisId, { nome });
    await refreshAnalisesInternal(clienteId);
    setAnaliseId(duplicated.id);
  }, [clienteId, refreshAnalisesInternal, setAnaliseId]);

  const setBasePadrao = useCallback(async (analysisId: string) => {
    if (!clienteId) return;
    await setAnaliseBasePadrao(clienteId, analysisId);
    await refreshAnalisesInternal(clienteId);
  }, [clienteId, refreshAnalisesInternal]);

  const getAnaliseOrigens = useCallback(async (analiseConsolidadaId: string) => {
    return listCalcirAnaliseOrigens(analiseConsolidadaId);
  }, []);

  const saveAnaliseOrigens = useCallback(async (analiseConsolidadaId: string, origens: CalcirAnaliseOrigem[]) => {
    await saveCalcirAnaliseOrigens(analiseConsolidadaId, origens);
  }, []);

  const resolveConflict = useCallback((action: "reload" | "overwrite" | "cancel") => {
    setConflictDetected(false);
    if (action === "reload") {
      pendingOverwriteRef.current = null;
      if (clienteId) loadFromDB(clienteId);
    } else if (action === "overwrite") {
      // Bypass watermark check by clearing it, then re-trigger save
      dataWatermarkRef.current = null;
      const snapshot = pendingOverwriteRef.current;
      pendingOverwriteRef.current = null;
      if (snapshot) {
        persistCurrentState(snapshot).catch((err) => {
          console.error("Overwrite save failed:", err);
        });
      }
    } else {
      pendingOverwriteRef.current = null;
    }
  }, [clienteId, loadFromDB, persistCurrentState]);

  return (
    <CalcirContext.Provider
      value={{
        state,
        derived,
        dispatch,
        loading,
        saving,
        error,
        loadFromDB,
        clienteId,
        setClienteId,
        analises,
        analiseId,
        analiseBasePadraoId,
        analisesLoading,
        setAnaliseId,
        refreshAnalises,
        createAnalise,
        updateAnalise,
        deleteAnalise: removeAnalise,
        duplicateAnalise,
        setBasePadrao,
        getAnaliseOrigens,
        saveAnaliseOrigens,
        selectedParceiroId,
        setSelectedParceiroId,
        conflictDetected,
        resolveConflict,
      }}
    >
      {children}
    </CalcirContext.Provider>
  );
}

export function useCalcir() {
  const ctx = useContext(CalcirContext);
  if (!ctx) throw new Error("useCalcir must be used within CalcirProvider");
  return ctx;
}
