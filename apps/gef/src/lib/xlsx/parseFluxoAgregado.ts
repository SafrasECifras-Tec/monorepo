import * as XLSX from 'xlsx';
import { XlsxParseError } from './parseError';
import type { AggregatedFlowRow } from '@/contexts/ImportDataContext';

const SHEET = 'Fluxo Agregado';

// Nomes aceitos para cada mês (case-insensitive, sem acento)
const MES_KEYS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

// Normaliza string para comparação (sem acentos, minúsculo)
const norm = (s: unknown) =>
  String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normalizaTipo(v: unknown): 'entrada' | 'saida' {
  const s = norm(v);
  return s === 'entrada' ? 'entrada' : 'saida';
}

function normalizaTipoLancamento(v: unknown): 'realizado' | 'orcado' {
  const s = norm(v);
  return s === 'realizado' ? 'realizado' : 'orcado';
}

/**
 * Lê a aba "Fluxo Agregado" e retorna AggregatedFlowRow[].
 *
 * Formato esperado (colunas):
 *   categoria | subcategoria | tipo | tipo_lancamento | ano | jan | fev | ... | dez
 *
 * Colunas obrigatórias: categoria, tipo, tipo_lancamento, ano
 * Colunas de meses: jan–dez (opcionais — células vazias viram 0)
 * subcategoria: opcional
 */
export function parseFluxoAgregado(wb: XLSX.WorkBook): { rows: AggregatedFlowRow[] } {
  const sheet = wb.Sheets[SHEET];
  if (!sheet) {
    throw new XlsxParseError(
      `Aba "${SHEET}" não encontrada. Verifique se está usando o modelo correto.`
    );
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rawRows.length === 0) {
    throw new XlsxParseError(`A aba "${SHEET}" está vazia.`);
  }

  // Verifica colunas obrigatórias na primeira linha
  const first = rawRows[0];
  const requiredCols = ['categoria', 'tipo', 'tipo_lancamento', 'ano'] as const;
  for (const col of requiredCols) {
    if (!(col in first)) {
      throw new XlsxParseError(
        `Coluna obrigatória "${col}" não encontrada na aba "${SHEET}". Baixe o modelo atualizado.`,
        col
      );
    }
  }

  let invalidCount = 0;
  const rows: AggregatedFlowRow[] = [];

  rawRows.forEach((r, i) => {
    const categoria = String(r['categoria'] ?? '').trim();
    if (!categoria) { invalidCount++; return; } // ignora linhas sem categoria

    const ano = Number(r['ano']);
    if (isNaN(ano) || ano < 2000 || ano > 2100) { invalidCount++; return; }

    // Lê os 12 meses — célula vazia ou NaN → 0, sempre positivo
    const valores: number[] = MES_KEYS.map(mes => {
      const v = Number(r[mes]);
      return isNaN(v) ? 0 : Math.abs(v);
    });

    // Subcategoria é opcional
    const subcategoriaRaw = r['subcategoria'];
    const subcategoria =
      subcategoriaRaw != null && String(subcategoriaRaw).trim() !== ''
        ? String(subcategoriaRaw).trim()
        : undefined;

    rows.push({
      categoria,
      ...(subcategoria ? { subcategoria } : {}),
      tipo:             normalizaTipo(r['tipo']),
      tipoLancamento:   normalizaTipoLancamento(r['tipo_lancamento']),
      ano,
      valores,
    });

    void i; // suprime warning de unused
  });

  return Object.assign({ rows }, { invalidCount });
}
