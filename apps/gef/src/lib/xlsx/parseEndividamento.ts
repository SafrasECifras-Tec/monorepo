import * as XLSX from 'xlsx';
import { XlsxParseError } from './parseError';
import { excelDateToMesAno } from './dateUtils';
import type { ParcelaRow } from '@/contexts/ImportDataContext';

const SHEET = 'Parcelas';

// ─── Normalização de chaves ───────────────────────────────────────────────────
// Converte os nomes de coluna para UPPER_SNAKE_CASE sem acentos para comparação
// tolerante a maiúsculas/minúsculas, acentos, espaços e underscores.
// Ex: "Nome_Credor_Devedor"   → "NOME_CREDOR_DEVEDOR"
//     "valor parcelas"        → "VALOR_PARCELAS"
//     "VALOR_AMORTIZAÇÃO"     → "VALOR_AMORTIZACAO"
//     "TAXA_JURO_MÊS"         → "TAXA_JURO_MES"

function normalizeKey(k: string): string {
  return k
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .trim();
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[normalizeKey(k)] = v;
  return out;
}

// ─── Detecção de formato ──────────────────────────────────────────────────────
// Formato real: colunas vindas do sistema de gestão (NOME_CREDOR_DEVEDOR etc.)
// Formato simples: colunas em português do nosso template simplificado

function isFormatoReal(row: Record<string, unknown>): boolean {
  const norm = normalizeRow(row);
  return 'NOME_CREDOR_DEVEDOR' in norm || 'VALOR_PARCELAS' in norm || 'VALOR_AMORTIZACAO' in norm;
}

// ─── Mapeamento do formato real ───────────────────────────────────────────────

// Lê o primeiro valor numérico não-zero dentre as chaves fornecidas
function pick(r: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = Number(r[k]);
    if (v && !isNaN(v)) return v;
  }
  return 0;
}

function mapLinhaReal(raw: Record<string, unknown>): ParcelaRow | null {
  const r = normalizeRow(raw);

  if (r['OPERACAO_CONTA'] === 'Receber') return null;

  const total = pick(r, 'VALOR_PARCELAS', 'VLR_PARCELAS', 'TOTAL');
  if (!total) return null;

  const juros = pick(r,
    'VALOR_JUROS_ENCARGOS', 'VLR_JUROS_ENCARGOS',
    'VALOR_JUROS', 'VLR_JUROS', 'JUROS',
  );

  // Principal: tenta colunas conhecidas; fallback = total - juros
  const principal = pick(r,
    'VALOR_AMORTIZACAO', 'VLR_AMORTIZACAO',
    'VALOR_PRINCIPAL', 'VLR_PRINCIPAL', 'PRINCIPAL', 'AMORTIZACAO',
  ) || (total - juros);

  const taxa = pick(r,
    'TAXA_JURO_MES', 'TAXA_JUROS_MES', 'TAXA_MES',
    'TAXA_JURO_ANO', 'TAXA_JUROS_ANO', 'TAXA',
  );

  return {
    mesAno:    excelDateToMesAno(r['DATA_VENCIMENTO']),
    banco:     String(r['NOME_CREDOR_DEVEDOR'] ?? r['CREDOR'] ?? r['BANCO'] ?? ''),
    contrato:  String(r['NR_CONTRATO'] ?? r['NUMERO_CONTRATO'] ?? r['CONTRATO'] ?? ''),
    tipo:      String(r['TIPO_DIVIDA'] ?? r['TIPO'] ?? ''),
    descricao: String(r['DESCRICAO'] ?? r['HISTORICO'] ?? ''),
    principal,
    juros,
    total,
    taxa,
  };
}

// ─── Mapeamento do formato simples (nosso template) ───────────────────────────

function mapLinhaSimples(raw: Record<string, unknown>): ParcelaRow | null {
  const r = normalizeRow(raw);

  const total = pick(r, 'VALOR_PARCELAS', 'VLR_PARCELAS', 'TOTAL');
  if (!total) return null;

  const juros = pick(r,
    'VALOR_JUROS_ENCARGOS', 'VLR_JUROS_ENCARGOS',
    'VALOR_JUROS', 'VLR_JUROS', 'JUROS',
  );

  const principal = pick(r,
    'VALOR_AMORTIZACAO', 'VLR_AMORTIZACAO',
    'VALOR_PRINCIPAL', 'VLR_PRINCIPAL', 'PRINCIPAL', 'AMORTIZACAO',
  ) || (total - juros);

  const taxa = pick(r,
    'TAXA_JURO_MES', 'TAXA_JUROS_MES', 'TAXA_MES',
    'TAXA_JURO_ANO', 'TAXA_JUROS_ANO', 'TAXA',
  );

  return {
    mesAno:    excelDateToMesAno(r['DATA_VENCIMENTO'] ?? r['MESANO']),
    banco:     String(r['NOME_CREDOR_DEVEDOR'] ?? r['BANCO']    ?? ''),
    contrato:  String(r['NR_CONTRATO']         ?? r['CONTRATO'] ?? ''),
    tipo:      String(r['TIPO_DIVIDA']         ?? r['TIPO']     ?? ''),
    descricao: String(r['DESCRICAO']           ?? ''),
    principal,
    juros,
    total,
    taxa,
  };
}

// ─── Parser principal ─────────────────────────────────────────────────────────

export function parseEndividamento(wb: XLSX.WorkBook): { parcelas: ParcelaRow[] } {
  const sheet = wb.Sheets[SHEET];
  if (!sheet) {
    throw new XlsxParseError(
      `Aba "${SHEET}" não encontrada. Renomeie sua aba de endividamento para "Parcelas".`
    );
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) throw new XlsxParseError('A aba "Parcelas" está vazia.');

  const formatoReal = isFormatoReal(rows[0]);
  let invalidCount = 0;
  const parcelas: ParcelaRow[] = [];

  rows.forEach(r => {
    const parcela = formatoReal ? mapLinhaReal(r) : mapLinhaSimples(r);
    if (!parcela) { invalidCount++; return; }
    parcelas.push(parcela);
  });

  if (parcelas.length === 0) {
    throw new XlsxParseError(
      'Nenhuma parcela válida encontrada. Verifique se as colunas estão corretas.'
    );
  }

  return Object.assign({ parcelas }, { invalidCount });
}
