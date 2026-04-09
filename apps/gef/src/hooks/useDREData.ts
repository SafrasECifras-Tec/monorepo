import { useImportedData, SafraImportData } from '@/contexts/ImportDataContext';

// Separador interno — não pode aparecer em nomes de safra ou atividade
const SEP = '|||';

/** Monta a chave composta para o dreDataRecord */
export function dreKey(safra: string, atividade?: string | null): string {
  return atividade ? `${safra}${SEP}${atividade}` : safra;
}

/**
 * Retorna todas as linhas importadas da aba DRE indexadas por chave composta
 * "safra|||atividade" (ou só "safra" quando atividade está vazia).
 * Múltiplas linhas com a mesma safra mas atividades distintas coexistem.
 */
export function useDREData(): Record<string, SafraImportData> | null {
  const { data } = useImportedData();
  if (!data.dre) return null;
  return Object.fromEntries(
    data.dre.safras.map(s => [dreKey(s.safra, s.atividade), s])
  );
}

/**
 * Retorna os nomes de safra únicos (sem duplicatas por atividade), em ordem de importação.
 */
export function useDRESafras(): string[] | null {
  const { data } = useImportedData();
  if (!data.dre) return null;
  const seen = new Set<string>();
  return data.dre.safras
    .map(s => s.safra)
    .filter(s => { if (seen.has(s)) return false; seen.add(s); return true; });
}

/**
 * Retorna os valores únicos de atividade presentes nas linhas DRE importadas.
 */
export function useDREAtividades(): string[] | null {
  const { data } = useImportedData();
  if (!data.dre) return null;
  const seen = new Set<string>();
  return data.dre.safras
    .map(s => s.atividade)
    .filter((a): a is string => !!a && !seen.has(a) && (seen.add(a), true));
}

// ── Agregação ─────────────────────────────────────────────────────────────────

/**
 * Agrega várias linhas de SafraImportData (diferentes atividades) em uma única linha
 * representando o total da safra. Valores numéricos são somados; indicadores de taxa
 * (margens, ROI, produtividade, preço médio) são recalculados a partir dos totais.
 */
export function aggregateSafraRows(rows: SafraImportData[]): SafraImportData {
  if (rows.length === 0) throw new Error('aggregateSafraRows: lista vazia');
  if (rows.length === 1) return rows[0];

  const sum = (field: keyof SafraImportData): number =>
    rows.reduce((acc, r) => acc + ((r[field] as number) || 0), 0);

  const totalArea       = sum('areaTotal');
  const totalProd       = sum('producaoTotal');
  const totalReceita    = sum('receitaBruta');
  const totalCusto      = sum('custoTotal');
  const totalLucro      = sum('lucroBruto');
  const totalResultado  = sum('resultadoLiquido');

  return {
    safra:                rows[0].safra,
    fazenda:              rows[0].fazenda,
    atividade:            undefined,                     // agregado: sem atividade específica
    areaTotal:            totalArea,
    producaoTotal:        totalProd,
    produtividadeMedia:   totalArea > 0 ? Math.round((totalProd / totalArea) * 10) / 10 : 0,
    precoMedioVenda:      totalProd > 0 ? Math.round((totalReceita / totalProd) * 100) / 100 : 0,
    receitaBruta:         totalReceita,
    custoTotal:           totalCusto,
    custoInsumos:         sum('custoInsumos'),
    custoOperacao:        sum('custoOperacao'),
    custoJuros:           sum('custoJuros'),
    lucroBruto:           totalLucro,
    despesasOperacionais: sum('despesasOperacionais'),
    ebitda:               sum('ebitda'),
    resultadoLiquido:     totalResultado,
    margemBruta:          totalReceita > 0 ? (totalLucro     / totalReceita) * 100 : 0,
    margemLiquida:        totalReceita > 0 ? (totalResultado / totalReceita) * 100 : 0,
    pontoEquilibrio:      totalProd > 0    ? totalCusto / totalProd               : 0,
    roi:                  totalCusto > 0   ? (totalResultado / totalCusto) * 100  : 0,
    orcadoVbp:            sum('orcadoVbp'),
    orcadoCusto:          sum('orcadoCusto'),
    orcadoResultado:      sum('orcadoResultado'),
    culturas:             rows.flatMap(r => r.culturas),
  };
}
