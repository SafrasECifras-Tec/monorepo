import * as XLSX from 'xlsx';
import { XlsxParseError } from './parseError';
import type { BalanceTableRow } from '@/contexts/ImportDataContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
}

function buildTree(flat: BalanceTableRow[]): BalanceTableRow[] {
  const roots: BalanceTableRow[] = [];
  const stack: BalanceTableRow[] = [];

  for (const row of flat) {
    const node: BalanceTableRow = { ...row, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) stack.pop();

    if (stack.length === 0) roots.push(node);
    else {
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }
    stack.push(node);
  }

  function clean(rows: BalanceTableRow[]) {
    for (const r of rows) {
      if (r.children?.length === 0) delete r.children;
      if (r.children) clean(r.children);
    }
  }
  clean(roots);
  return roots;
}

// Colunas estruturais que nunca são colunas de valor
const FIXED_COLS = new Set([
  'Grupo', 'grupo', 'Subgrupo', 'subgrupo', 'Item', 'item',
  'id', 'name', 'level',
]);

// Detecta quais colunas do cabeçalho são colunas de valor (não estruturais)
function detectValueColumns(row: Record<string, unknown>): string[] {
  return Object.keys(row).filter(k => !FIXED_COLS.has(k));
}

// ─── Formato antigo: id / name / level / col_xxx ─────────────────────────────

function isFormatoAntigo(row: Record<string, unknown>): boolean {
  return 'id' in row && 'level' in row && 'name' in row;
}

function parseSheetAntigo(wb: XLSX.WorkBook, sheetName: string): { rows: BalanceTableRow[]; columns: string[] } {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new XlsxParseError(`Aba "${sheetName}" não encontrada.`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) throw new XlsxParseError(`Aba "${sheetName}" está vazia.`);

  const REQUIRED = ['id', 'name', 'level'];
  for (const col of REQUIRED) {
    if (!(col in rows[0])) throw new XlsxParseError(`Coluna "${col}" não encontrada em "${sheetName}".`, col);
  }

  // Mapeia colunas antigas (col_xxx) para labels legíveis
  const LEGACY_MAP: Record<string, string> = {
    col_2022_23:            '2022/23',
    col_2023_24:            '2023/24',
    col_primeira_avaliacao: '1ª Avaliação',
    col_visao_atual:        'Visão Atual',
  };

  // Detecta colunas de valor presentes, preferindo as legadas com seus labels amigáveis
  const rawValueCols = detectValueColumns(rows[0]);
  const columns: string[] = rawValueCols.map(k => LEGACY_MAP[k] ?? k);

  const flat: BalanceTableRow[] = rows.map(r => ({
    id:     String(r['id'] ?? ''),
    name:   String(r['name'] ?? ''),
    level:  Number(r['level']) || 0,
    values: rawValueCols.map(k => Number(r[k]) || 0),
  }));

  return { rows: buildTree(flat), columns };
}

// ─── Formato novo: Grupo / Subgrupo / Item / colunas livres ──────────────────
// Muito mais amigável para preenchimento manual ou copy-paste.
//
// Regra de nível:
//   Só Grupo preenchido        → level 0 (grupo principal)
//   Grupo + Subgrupo           → level 1 (subcategoria)
//   Grupo + Subgrupo + Item    → level 2 (linha de detalhe)
//
// Colunas de valor: tudo que não for Grupo / Subgrupo / Item.
// Exemplos válidos: "2022/23", "2024/25", "1ª Avaliação", "2ª Avaliação", "Visão Atual"

function isFormatoNovo(row: Record<string, unknown>): boolean {
  return 'Grupo' in row || 'grupo' in row;
}

function parseSheetNovo(wb: XLSX.WorkBook, sheetName: string): { rows: BalanceTableRow[]; columns: string[] } {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new XlsxParseError(`Aba "${sheetName}" não encontrada.`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) throw new XlsxParseError(`Aba "${sheetName}" está vazia.`);

  // Detecta colunas de valor dinamicamente na primeira linha com dados
  const columns = detectValueColumns(rows[0]);

  const flat: BalanceTableRow[] = [];
  const idCount: Record<string, number> = {};

  rows.forEach(r => {
    const grupo    = String(r['Grupo']    ?? r['grupo']    ?? '').trim();
    const subgrupo = String(r['Subgrupo'] ?? r['subgrupo'] ?? '').trim();
    const item     = String(r['Item']     ?? r['item']     ?? '').trim();

    if (!grupo) return; // pular linhas sem grupo

    const nome = item || subgrupo || grupo;
    const level = item ? 2 : subgrupo ? 1 : 0;

    const baseId = slug(nome);
    idCount[baseId] = (idCount[baseId] || 0) + 1;
    const id = idCount[baseId] > 1 ? `${baseId}-${idCount[baseId]}` : baseId;

    flat.push({
      id,
      name: nome,
      level,
      // Mapeia cada coluna detectada → valor numérico (0 se ausente)
      values: columns.map(col => Number(r[col]) || 0),
    });
  });

  if (flat.length === 0) throw new XlsxParseError(`Nenhuma linha válida encontrada em "${sheetName}".`);
  return { rows: buildTree(flat), columns };
}

// ─── Parser de uma aba (detecta formato automaticamente) ─────────────────────

function parseSheet(wb: XLSX.WorkBook, sheetName: string): { rows: BalanceTableRow[]; columns: string[] } {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new XlsxParseError(`Aba "${sheetName}" não encontrada.`);

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) throw new XlsxParseError(`Aba "${sheetName}" está vazia.`);

  if (isFormatoAntigo(rows[0])) return parseSheetAntigo(wb, sheetName);
  if (isFormatoNovo(rows[0]))   return parseSheetNovo(wb, sheetName);

  throw new XlsxParseError(
    `Formato não reconhecido em "${sheetName}". ` +
    `Use as colunas "Grupo / Subgrupo / Item" seguidas das colunas de valor (ex: 2022/23, 2024/25, 1ª Avaliação).`
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function parseBalanco(wb: XLSX.WorkBook): { columns: string[]; ativo: BalanceTableRow[]; passivo: BalanceTableRow[] } {
  const ativo   = parseSheet(wb, 'Ativo');
  const passivo = parseSheet(wb, 'Passivo');

  // Usa as colunas do Ativo como referência (Passivo deve ter as mesmas)
  // Em caso de divergência, mantém a união das duas para não perder dados
  const allCols = [...new Set([...ativo.columns, ...passivo.columns])];

  return { columns: allCols, ativo: ativo.rows, passivo: passivo.rows };
}
