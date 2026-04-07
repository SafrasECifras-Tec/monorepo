import * as XLSX from 'xlsx';
import { XlsxParseError } from './parseError';
import { excelDateToIso } from './dateUtils';
import type { TransactionRow } from '@/contexts/ImportDataContext';

const SHEET = 'Transações';
// Colunas obrigatórias mínimas
const REQUIRED = ['data', 'descricao', 'valor', 'tipo'] as const;

// Normaliza string para comparação (sem acentos, minúsculo)
const normKey = (s: unknown) =>
  String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isSaldoInicial = (r: Record<string, unknown>) =>
  normKey(r['descricao']).includes('saldo inicial') ||
  normKey(r['categoria']).includes('saldo inicial');

// Normaliza tipo: aceita "saída" (com acento), "saida", "entrada"
function normalizaTipo(v: unknown): 'entrada' | 'saida' {
  const s = String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s === 'entrada' ? 'entrada' : 'saida';
}

// Normaliza status
function normalizaStatus(v: unknown): TransactionRow['status'] {
  const map: Record<string, TransactionRow['status']> = {
    pago: 'pago', recebido: 'recebido', pendente: 'pendente', atrasado: 'atrasado',
  };
  const s = String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return map[s] ?? 'pendente';
}

export function parseFluxoCaixa(wb: XLSX.WorkBook): { transactions: TransactionRow[]; saldoInicial?: number } {
  const sheet = wb.Sheets[SHEET];
  if (!sheet) {
    throw new XlsxParseError(
      `Aba "${SHEET}" não encontrada. Verifique se está usando o modelo correto.`
    );
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) throw new XlsxParseError('A aba "Transações" está vazia.');

  const first = rows[0];
  for (const col of REQUIRED) {
    if (!(col in first)) {
      throw new XlsxParseError(
        `Coluna obrigatória "${col}" não encontrada. Baixe o modelo atualizado.`, col
      );
    }
  }

  // Extrai saldo inicial da primeira linha marcada como tal
  let saldoInicial: number | undefined;
  const saldoRow = rows.find(isSaldoInicial);
  if (saldoRow) {
    const v = Number(saldoRow['valor']);
    if (!isNaN(v)) saldoInicial = Math.abs(v);
  }

  let invalidCount = 0;
  const result: TransactionRow[] = [];

  rows.forEach((r, i) => {
    if (isSaldoInicial(r)) return; // linha de saldo inicial não é transação
    const valor = Number(r['valor']);
    if (isNaN(valor)) { invalidCount++; return; }

    const subcategoriaRaw = r['subcategoria'];
    result.push({
      id:          Number(r['id']) || i + 1,                        // id é opcional
      data:        excelDateToIso(r['data']),
      descricao:   String(r['descricao']   ?? ''),
      fornecedor:  String(r['fornecedor']  ?? ''),                   // opcional
      categoria:   String(r['categoria']   ?? ''),
      ...(subcategoriaRaw != null && String(subcategoriaRaw).trim() !== ''
        ? { subcategoria: String(subcategoriaRaw).trim() }
        : {}),                                                       // opcional — só inclui se preenchido
      centroCusto: String(r['centroCusto'] ?? r['centro_custo'] ?? ''), // opcional
      valor,
      status:      normalizaStatus(r['status']),
      tipo:        normalizaTipo(r['tipo']),
    });
  });

  return Object.assign({ transactions: result, saldoInicial }, { invalidCount });
}
