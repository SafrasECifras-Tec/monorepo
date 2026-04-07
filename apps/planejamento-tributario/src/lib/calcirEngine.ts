// ==========================================
// CALCIR Engine — Fórmulas de cálculo fiscal
// ==========================================

export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"] as const;
export type Mes = typeof MESES[number];
export type FunruralPJRegime = "receita_bruta" | "folha";
export type RegimeApuracaoRural = "automatico" | "arbitramento" | "resultado";

const TAXA_REDUCAO_POR_PRODUTO: Record<string, number> = {
  "ARROZ COM CASCA": 0.6,
  SOJA: 0.6,
  "MILHO EM GRAO": 0.6,
  SORGO: 0.6,
  GERGELIM: 0.6,
  ALGODAO: 0.6,
  CAFE: 1,
  UVA: 1,
  BEZERRO: 0.6,
  TERNEIRO: 0.6,
  NOVILHO: 0.6,
  VACA: 0.6,
  BOI: 0.6,
  FEIJAO: 1,
  PEIXES: 1,
  "PEIXES EXOTICOS": 0.6,
};

function normalizarProduto(produto: string): string {
  return (produto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function getTaxaReducaoProduto(produto: string): number {
  const normalizado = normalizarProduto(produto);
  return TAXA_REDUCAO_POR_PRODUTO[normalizado] ?? 1;
}

export function aplicarTaxaReducao(valorBruto: number, taxaReducao: number): number {
  const taxa = Number.isFinite(taxaReducao) && taxaReducao > 0 ? taxaReducao : 1;
  return Math.max(0, valorBruto) * taxa;
}

// === Funrural PF (sub-rogação padrão) ===
export const FUNRURAL_PF_ALIQUOTA = 0.0163; // 1,63%

// === IRPF 2026 Tabela Progressiva ===
const FAIXAS_IRPF = [
  { limite: 28467.20, aliquota: 0, deducao: 0 },
  { limite: 33919.80, aliquota: 0.075, deducao: 2135.04 },
  { limite: 45012.60, aliquota: 0.15, deducao: 4679.03 },
  { limite: 55976.16, aliquota: 0.225, deducao: 8054.97 },
  { limite: Infinity, aliquota: 0.275, deducao: 10853.78 },
];

const SIMPLIFICADO_TETO = 17640.00;
const SIMPLIFICADO_PERC = 0.20;

export function calcularIRPF(baseCalculo: number): {
  imposto: number;
  usouSimplificado: boolean;
  deducaoSimplificada: number;
  baseTributavel: number;
} {
  if (baseCalculo <= 0) {
    return { imposto: 0, usouSimplificado: false, deducaoSimplificada: 0, baseTributavel: 0 };
  }

  // Cálculo pelo simplificado
  const deducaoSimplificada = Math.min(baseCalculo * SIMPLIFICADO_PERC, SIMPLIFICADO_TETO);
  const baseSimplificado = Math.max(0, baseCalculo - deducaoSimplificada);
  const impostoSimplificado = calcularImpostoProgressivo(baseSimplificado);

  // Cálculo completo (sem deduções adicionais por ora)
  const impostoCompleto = calcularImpostoProgressivo(baseCalculo);

  // Escolhe o menor
  if (impostoSimplificado <= impostoCompleto) {
    return {
      imposto: impostoSimplificado,
      usouSimplificado: true,
      deducaoSimplificada,
      baseTributavel: baseSimplificado,
    };
  }
  return {
    imposto: impostoCompleto,
    usouSimplificado: false,
    deducaoSimplificada: 0,
    baseTributavel: baseCalculo,
  };
}

function calcularImpostoProgressivo(base: number): number {
  if (base <= 0) return 0;
  for (const faixa of FAIXAS_IRPF) {
    if (base <= faixa.limite) {
      return Math.max(0, base * faixa.aliquota - faixa.deducao);
    }
  }
  const ultima = FAIXAS_IRPF[FAIXAS_IRPF.length - 1];
  return Math.max(0, base * ultima.aliquota - ultima.deducao);
}

// === IRPF para cenário PF puro — calculado POR PARCEIRO ===
// Usa a mesma lógica de regime da apuração detalhada (resultado/arbitramento/automático).
export function calcularIRPFExclusivoPF(
  receitaBrutaTotal: number,
  despesaTotal: number = 0,
  participacoes?: number[],
  regimesApuracao?: RegimeApuracaoRural[],
  lcdprObrigatorio: boolean = false,
): number {
  if (receitaBrutaTotal <= 0) return 0;

  const parcs = participacoes && participacoes.length > 0 ? participacoes : [100];
  let total = 0;

  for (let index = 0; index < parcs.length; index++) {
    const perc = parcs[index];
    const receitaParceiro = receitaBrutaTotal * (perc / 100);
    const despesaParceiro = Math.max(0, despesaTotal) * (perc / 100);
    const baseResultado = Math.max(0, receitaParceiro - despesaParceiro);
    const baseArbitramento = receitaParceiro * 0.20;

    const regime = regimesApuracao?.[index] ?? "automatico";
    let regimeEfetivo: "resultado" | "arbitramento";

    if (lcdprObrigatorio) {
      regimeEfetivo = "arbitramento";
    } else if (regime === "automatico") {
      regimeEfetivo = baseArbitramento <= baseResultado ? "arbitramento" : "resultado";
    } else {
      regimeEfetivo = regime;
    }

    const baseTributavel = regimeEfetivo === "arbitramento" ? baseArbitramento : baseResultado;
    const { imposto } = calcularIRPF(baseTributavel);
    total += imposto;
  }

  return total;
}

// === Impostos PJ ===
export interface ImpostosPJ {
  faturamentoSemPisCofins: number;
  faturamentoComPisCofins: number;
  faturamentoTotal: number;
  baseCalculoIR: number;
  baseCalculoCSLL: number;
  ir15: number;
  irAdicional10: number;
  csll9: number;
  funrural: number;
  diferencaFunrural055: number;
  pis: number;
  cofins: number;
  totalImpostos: number;
}

interface FunruralOptions {
  regime?: FunruralPJRegime;
  aliquota?: number;
  folhaPagamentoAnual?: number;
  /** Monthly revenue array used only for Funrural base (excludes non-incidente revenues) */
  funruralBaseMensal?: number[];
}

export function calcularFunrural(base: number, aliquota: number): number {
  return Math.max(0, base) * Math.max(0, aliquota);
}

export function calcularDiferencaFunrural(base: number, regime: FunruralPJRegime): number {
  if (regime !== "receita_bruta") return 0;
  return Math.max(0, base) * 0.006;
}

export function calcularImpostosPJ(
  faturamentoSemPisCofins: number,
  faturamentoComPisCofins: number,
  options: FunruralOptions = {},
): ImpostosPJ {
  const faturamentoTotal = faturamentoSemPisCofins + faturamentoComPisCofins;
  const regime = options.regime ?? "receita_bruta";
  const aliquotaFunrural = regime === "folha" ? 0.288 : (options.aliquota ?? 0.0223);
  const folhaPagamentoAnual = options.folhaPagamentoAnual ?? 0;
  
  // Base de cálculo (usa total s/ PIS/COFINS + c/ PIS/COFINS)
  const limiteAnual = 5000000;
  const faturamentoAteLimite = Math.min(faturamentoTotal, limiteAnual);
  const faturamentoExcedente = Math.max(0, faturamentoTotal - limiteAnual);

  const baseCalculoIR = (faturamentoAteLimite * 0.08) + (faturamentoExcedente * 0.088);
  const baseCalculoCSLL = (faturamentoAteLimite * 0.12) + (faturamentoExcedente * 0.132);

  const ir15 = baseCalculoIR * 0.15;
  // IR Adicional: excedente sobre R$60k por trimestre (R$240k anual) * 10%
  const irAdicional10 = Math.max(0, baseCalculoIR - 240000) * 0.10;
  const csll9 = baseCalculoCSLL * 0.09;
  const baseFunrural = regime === "folha" ? folhaPagamentoAnual : faturamentoTotal;
  const funrural = calcularFunrural(baseFunrural, aliquotaFunrural);
  const diferencaFunrural055 = calcularDiferencaFunrural(faturamentoTotal, regime);

  // PIS/COFINS sobre receitas com flag
  const pis = faturamentoComPisCofins * 0.0065;
  const cofins = faturamentoComPisCofins * 0.03;

  // diferencaFunrural055 é INFORMATIVA (PJ paga 2,05% vs PF 1,50%), NÃO soma no total
  const totalImpostos = ir15 + irAdicional10 + csll9 + funrural + pis + cofins;

  return {
    faturamentoSemPisCofins,
    faturamentoComPisCofins,
    faturamentoTotal,
    baseCalculoIR,
    baseCalculoCSLL,
    ir15,
    irAdicional10,
    csll9,
    funrural,
    diferencaFunrural055,
    pis,
    cofins,
    totalImpostos,
  };
}

// === Distribuição de Dividendos ===
export interface DistribuicaoDividendos {
  receitaPJ: number;
  impostosPJ: number;
  demaisDespesas: number;
  dividendosADistribuir: number;
  lucroAcumulado: number;
  dividendosTributavel: number;
}

export function calcularDistribuicaoDividendos(
  receitaPJRealizada: number,
  impostosPJ: number,
  demaisDespesas: number,
  lucroAcumulado: number = 0,
): DistribuicaoDividendos {
  const dividendosADistribuir = receitaPJRealizada - impostosPJ - demaisDespesas;
  const dividendosTributavel = dividendosADistribuir + lucroAcumulado;

  return {
    receitaPJ: receitaPJRealizada,
    impostosPJ,
    demaisDespesas,
    dividendosADistribuir,
    lucroAcumulado,
    dividendosTributavel: Math.max(0, dividendosTributavel),
  };
}

// === Retenção na Fonte 10% ===
export function calcularRetencaoFonte(dividendosTributavel: number, percParceiro: number): {
  distribuicao: number;
  retencao: number;
} {
  const distribuicao = dividendosTributavel * (percParceiro / 100);
  const retencao = distribuicao * 0.10;
  return { distribuicao, retencao };
}

export function calcularRetencaoFonteMensal(
  distribuicoesMensais: number[],
  percParceiro: number,
  limiteMensal: number = 50000,
): {
  distribuicao: number;
  retencao: number;
  distribuicoesMensais: number[];
  retencoesMensais: number[];
} {
  const distribuicoes = distribuicoesMensais.map((valor) => Math.max(0, valor) * (percParceiro / 100));
  const retencoes = distribuicoes.map((valor) => (valor > limiteMensal ? valor * 0.10 : 0));
  const distribuicao = distribuicoes.reduce((s, v) => s + v, 0);
  const retencao = retencoes.reduce((s, v) => s + v, 0);
  return { distribuicao, retencao, distribuicoesMensais: distribuicoes, retencoesMensais: retencoes };
}

// === IRPFM (Lei 15.270/2025) — Fórmula de rampa ===
export function calcularIRPFM(
  rendaGlobal: number,
  retencoesFonte: number,
  lucrosIsentosAcumulados: number = 0,
  baseTabelaProgressiva?: number,
): {
  baseIRPFM: number;
  baseTabelaProgressiva: number;
  lucrosIsentos: number;
  rendaGlobalLiquida: number;
  aliquota: number;
  impostoBruto: number;
  impostoTabelaProgressiva: number;
  impostoDevido: number;
  irPagoRetido: number;
  irpfmDevido: number;
  irRestituir: number;
} {
  const lucrosIsentos = Math.max(0, lucrosIsentosAcumulados);
  const rendaGlobalLiquida = Math.max(0, rendaGlobal - lucrosIsentos);

  let aliquota = 0;
  if (rendaGlobalLiquida <= 600000) {
    aliquota = 0;
  } else if (rendaGlobalLiquida >= 1200000) {
    aliquota = 10;
  } else {
    // Rampa: ((rendaGlobalLiquida / 60000) - 10) / 100 → resultado em decimal, * 100 p/ percentual
    aliquota = (rendaGlobalLiquida / 60000 - 10); // já em %
  }

  const impostoBruto = rendaGlobalLiquida * (aliquota / 100);
  const baseTabela = Math.max(0, Number.isFinite(baseTabelaProgressiva) ? (baseTabelaProgressiva as number) : rendaGlobalLiquida);
  const { imposto: impostoTabelaProgressiva } = calcularIRPF(baseTabela);
  const impostoDevido = Math.max(impostoTabelaProgressiva, impostoBruto);
  const creditoFonte = Math.max(0, retencoesFonte);
  const irpfmDevido = Math.max(0, impostoDevido - creditoFonte);
  const irRestituir = Math.max(0, creditoFonte - impostoDevido);

  return {
    baseIRPFM: rendaGlobal,
    baseTabelaProgressiva: baseTabela,
    lucrosIsentos,
    rendaGlobalLiquida,
    aliquota,
    impostoBruto,
    impostoTabelaProgressiva,
    impostoDevido,
    irPagoRetido: creditoFonte,
    irpfmDevido,
    irRestituir,
  };
}

// === Economia Tributária ===
export function calcularEconomia(
  irpfExclusivoPF: number,
  irpfParceria: number,
  tributosPJ: number,
  irpfmTotal: number = 0,
): {
  antes: number;
  depois: number;
  economia: number;
  percentual: number;
} {
  const antes = irpfExclusivoPF;
  const depois = irpfParceria + tributosPJ + irpfmTotal;
  const economia = antes - depois;
  const percentual = antes > 0 ? (economia / antes) * 100 : 0;

  return { antes, depois, economia, percentual };
}

// === Resultado por parceiro ===
export interface ResultadoParceiro {
  parceiro: string;
  parceiroId: string;
  percReceita: number;
  percDespesa: number;
  receitaApuracao: number;
  despesaApuracao: number;
  resultadoApuracao: number;
  receitaParticular: number;
  despesaParticular: number;
  resultadoParticular: number;
  receitaTotal: number;
  despesaTotal: number;
  resultadoTotal: number;
  prejuizoACompensar: number;
  baseCalculo: number;
  baseArbitramento: number;
  baseTributavel: number;
  irpfCalculado: number;
  regimeApuracao?: "automatico" | "arbitramento" | "resultado";
  regimeEfetivo?: "arbitramento" | "resultado";
  prejuizoAcumulado: number;
}

export function calcularResultadoParceiro(
  parceiroId: string,
  parceiro: string,
  percReceita: number,
  percDespesa: number,
  receitaTotalPF: number,
  despesaTotalPF: number,
  receitaParticular: number,
  despesaParticular: number,
  prejuizoAnterior: number = 0,
  regimeApuracao: "automatico" | "arbitramento" | "resultado" = "automatico",
  lcdprObrigatorio: boolean = false,
): ResultadoParceiro {
  const receitaApuracao = receitaTotalPF * (percReceita / 100);
  const despesaApuracao = despesaTotalPF * (percDespesa / 100);
  const resultadoApuracao = receitaApuracao - despesaApuracao;

  const resultadoParticular = receitaParticular - despesaParticular;
  const receitaTotal = receitaApuracao + receitaParticular;
  const despesaTotal = despesaApuracao + despesaParticular;
  const resultadoTotal = resultadoApuracao + resultadoParticular;
  const baseArbitramento = receitaTotal * 0.20;

  // Se resultado negativo, acumula prejuízo
  const baseCalculo = resultadoTotal - prejuizoAnterior;

  let regimeEfetivo: "resultado" | "arbitramento";
  if (lcdprObrigatorio) {
    regimeEfetivo = "arbitramento";
  } else if (regimeApuracao === "automatico") {
    regimeEfetivo = baseArbitramento <= Math.max(0, baseCalculo) ? "arbitramento" : "resultado";
  } else {
    regimeEfetivo = regimeApuracao;
  }

  const baseTributavel = regimeEfetivo === "arbitramento" ? baseArbitramento : Math.max(0, baseCalculo);

  let irpfCalculado = 0;
  let prejuizoAcumulado = 0;

  if (baseCalculo > 0) {
    const { imposto } = calcularIRPF(baseTributavel);
    irpfCalculado = imposto;
  } else {
    prejuizoAcumulado = Math.abs(baseCalculo);
  }

  return {
    parceiro,
    parceiroId,
    percReceita,
    percDespesa,
    receitaApuracao,
    despesaApuracao,
    resultadoApuracao,
    receitaParticular,
    despesaParticular,
    resultadoParticular,
    receitaTotal,
    despesaTotal,
    resultadoTotal,
    prejuizoACompensar: prejuizoAnterior,
    baseCalculo: Math.max(0, baseCalculo),
    baseArbitramento,
    baseTributavel,
    irpfCalculado,
    prejuizoAcumulado,
  };
}

// === Apuração Trimestral PJ detalhada ===
export interface TrimestrePJ {
  trimestre: number;
  faturamento: number;
  faturamentoTributavel: number;
  funrural: number;
  baseIR: number;
  ir15: number;
  excedenteIR: number;
  irAdicional: number;
  irTotal: number;
  baseCSLL: number;
  csll9: number;
}

export function calcularTrimestresPJ(
  receitasMensaisPJ: number[],
  options: FunruralOptions = {},
): TrimestrePJ[] {
  const trimestres: TrimestrePJ[] = [];
  const regime = options.regime ?? "receita_bruta";
  const aliquotaFunrural = regime === "folha" ? 0.288 : (options.aliquota ?? 0.0223);
  const folhaPagamentoAnual = options.folhaPagamentoAnual ?? 0;
  const folhaPorTrimestre = folhaPagamentoAnual / 4;
  
  const faturamentoAnual = receitasMensaisPJ.reduce((s, v) => s + v, 0);
  const limiteAnual = 5000000;
  
  const faturamentoAteLimiteAnual = Math.min(faturamentoAnual, limiteAnual);
  const faturamentoExcedenteAnual = Math.max(0, faturamentoAnual - limiteAnual);

  const baseIRAnual = (faturamentoAteLimiteAnual * 0.08) + (faturamentoExcedenteAnual * 0.088);
  const baseCSLLAnual = (faturamentoAteLimiteAnual * 0.12) + (faturamentoExcedenteAnual * 0.132);

  const excedenteIRAnual = Math.max(0, baseIRAnual - 240000);
  const irAdicionalAnual = excedenteIRAnual * 0.10;
  
  const ir15Anual = baseIRAnual * 0.15;
  const csll9Anual = baseCSLLAnual * 0.09;
  
  const funruralBaseMensal = options.funruralBaseMensal ?? receitasMensaisPJ;

  for (let t = 0; t < 4; t++) {
    const meses = receitasMensaisPJ.slice(t * 3, t * 3 + 3);
    const faturamento = meses.reduce((s, v) => s + v, 0);
    const proporcao = faturamentoAnual > 0 ? faturamento / faturamentoAnual : 0;

    // IR/CSLL Presumido usa faturamento BRUTO (taxa de redução por produto NÃO se aplica)
    // Funrural usa apenas receitas com incidência (exclui não-incidentes como exportações)
    const faturamentoFunruralTrimestre = funruralBaseMensal.slice(t * 3, t * 3 + 3).reduce((s, v) => s + v, 0);
    const baseFunrural = regime === "folha" ? folhaPorTrimestre : faturamentoFunruralTrimestre;
    const funrural = calcularFunrural(baseFunrural, aliquotaFunrural);
    
    const baseIR = baseIRAnual * proporcao;
    const ir15 = ir15Anual * proporcao;
    
    // Distribuição do Adicional de 10% do IRPJ com base na receita anual
    // (para lidar com o cenário onde o usuário inseriu as receitas num único mês, mas o teto é anual)
    const excedenteIR = excedenteIRAnual * proporcao;
    const irAdicional = irAdicionalAnual * proporcao;
    
    const baseCSLL = baseCSLLAnual * proporcao;
    const csll9 = csll9Anual * proporcao;

    trimestres.push({
      trimestre: t + 1,
      faturamento,
      faturamentoTributavel: faturamento, // mantém interface, mas = bruto
      funrural,
      baseIR,
      ir15,
      excedenteIR,
      irAdicional,
      irTotal: ir15 + irAdicional,
      baseCSLL,
      csll9,
    });
  }

  return trimestres;
}
