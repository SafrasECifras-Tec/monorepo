import * as XLSX from 'xlsx';
import { XlsxParseError } from './parseError';
import type { SafraImportData, CulturaImportData } from '@/contexts/ImportDataContext';

const SHEET = 'DRE';
const REQUIRED = ['safra', 'receitaBruta', 'custoTotal'] as const;

export function parseDRE(wb: XLSX.WorkBook): { safras: SafraImportData[] } {
  const sheet = wb.Sheets[SHEET];
  if (!sheet) {
    throw new XlsxParseError(
      `Aba "${SHEET}" não encontrada. Verifique se está usando o modelo correto.`
    );
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) {
    throw new XlsxParseError('A planilha está vazia.');
  }

  const first = rows[0];
  for (const col of REQUIRED) {
    if (!(col in first)) {
      throw new XlsxParseError(
        `Coluna obrigatória "${col}" não encontrada. Baixe o modelo atualizado.`,
        col
      );
    }
  }

  // Read culturas sheet if present (optional)
  const culturasSheet = wb.Sheets['Culturas'];
  const culturasRows = culturasSheet
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(culturasSheet)
    : [];

  // Group culturas by safra
  const culturasBySafra: Record<string, CulturaImportData[]> = {};
  for (const r of culturasRows) {
    const safra = String(r.safra ?? '');
    if (!culturasBySafra[safra]) culturasBySafra[safra] = [];
    culturasBySafra[safra].push({
      nome:          String(r.nome ?? ''),
      area:          Number(r.area) || 0,
      producao:      Number(r.producao) || 0,
      produtividade: Number(r.produtividade) || 0,
      precoMedio:    Number(r.precoMedio) || 0,
      receitaBruta:  Number(r.receitaBruta) || 0,
      custoTotal:    Number(r.custoTotal) || 0,
      margemLiquida: Number(r.margemLiquida) || 0,
      variacaoMargem: Number(r.variacaoMargem) || 0,
    });
  }

  const safras: SafraImportData[] = rows.map(r => {
    const safra = String(r.safra ?? '');
    return {
      safra,
      areaTotal:            Number(r.areaTotal) || 0,
      producaoTotal:        Number(r.producaoTotal) || 0,
      produtividadeMedia:   Number(r.produtividadeMedia) || 0,
      precoMedioVenda:      Number(r.precoMedioVenda) || 0,
      receitaBruta:         Number(r.receitaBruta) || 0,
      custoTotal:           Number(r.custoTotal) || 0,
      custoInsumos:         Number(r.custoInsumos) || 0,
      custoOperacao:        Number(r.custoOperacao) || 0,
      custoJuros:           Number(r.custoJuros) || 0,
      lucroBruto:           Number(r.lucroBruto) || 0,
      despesasOperacionais: Number(r.despesasOperacionais) || 0,
      ebitda:               Number(r.ebitda) || 0,
      resultadoLiquido:     Number(r.resultadoLiquido) || 0,
      margemBruta:          Number(r.margemBruta) || 0,
      margemLiquida:        Number(r.margemLiquida) || 0,
      pontoEquilibrio:      Number(r.pontoEquilibrio) || 0,
      roi:                  Number(r.roi) || 0,
      orcadoVbp:            Number(r.orcadoVbp) || 0,
      orcadoCusto:          Number(r.orcadoCusto) || 0,
      orcadoResultado:      Number(r.orcadoResultado) || 0,
      culturas:             culturasBySafra[safra] ?? [],
    };
  });

  return { safras };
}
