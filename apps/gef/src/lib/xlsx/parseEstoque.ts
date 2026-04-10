import * as XLSX from 'xlsx';
import { XlsxParseError } from './parseError';
import { excelDateToIso } from './dateUtils';
import type { CropStockImport } from '@/contexts/ImportDataContext';

const SHEET_STOCK = 'Estoque';
const SHEET_SALES = 'Vendas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Lê o nome da cultura (aceita "Cultura" PT ou "name" legado)
function getCropName(r: Record<string, unknown>): string {
  return String(r['Cultura'] ?? r['name'] ?? '');
}

// Lê estoque inicial (aceita PT ou legado)
function getInitialStock(r: Record<string, unknown>): number {
  return Number(r['Estoque Inicial (sacas)'] ?? r['Estoque Inicial'] ?? r['initialStock']) || 0;
}

// Lê estoque vendido (aceita PT ou legado)
function getSoldStock(r: Record<string, unknown>): number {
  return Number(r['Estoque Vendido (sacas)'] ?? r['Estoque Vendido'] ?? r['soldStock']) || 0;
}

// Cor padrão por cultura (fallback quando não fornecida no template)
const CROP_COLORS: Record<string, { color: string; bgColor: string }> = {
  soja:           { color: 'text-amber-700',   bgColor: 'bg-amber-50 border-amber-200'   },
  milho:          { color: 'text-yellow-700',  bgColor: 'bg-yellow-50 border-yellow-200' },
  'milho safrinha': { color: 'text-lime-700',  bgColor: 'bg-lime-50 border-lime-200'     },
  feijao:         { color: 'text-red-700',     bgColor: 'bg-red-50 border-red-200'       },
  trigo:          { color: 'text-orange-700',  bgColor: 'bg-orange-50 border-orange-200' },
  algodao:        { color: 'text-blue-700',    bgColor: 'bg-blue-50 border-blue-200'     },
  cafe:           { color: 'text-stone-700',   bgColor: 'bg-stone-50 border-stone-200'   },
};

function getCropColor(name: string): { color: string; bgColor: string } {
  const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CROP_COLORS[key] ?? { color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' };
}

// ─── Parser principal ─────────────────────────────────────────────────────────

export function parseEstoque(wb: XLSX.WorkBook): { crops: CropStockImport[] } {
  const stockSheet = wb.Sheets[SHEET_STOCK];
  if (!stockSheet) {
    throw new XlsxParseError(`Aba "${SHEET_STOCK}" não encontrada.`);
  }

  const stockRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(stockSheet);
  if (stockRows.length === 0) throw new XlsxParseError('A aba "Estoque" está vazia.');

  // Verifica se tem coluna de nome (PT ou legado)
  const firstRow = stockRows[0];
  if (!('Cultura' in firstRow) && !('name' in firstRow)) {
    throw new XlsxParseError('Coluna "Cultura" não encontrada na aba Estoque.', 'Cultura');
  }

  // ── Vendas (aba opcional) ────────────────────────────────────────────────
  const salesSheet = wb.Sheets[SHEET_SALES];
  const salesRows = salesSheet
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(salesSheet)
    : [];

  // Agrupa vendas por nome da cultura (aceita "Cultura" PT ou "cropName" legado)
  const salesByCrop: Record<string, CropStockImport['sales']> = {};
  for (const r of salesRows) {
    const cropName = String(r['Cultura'] ?? r['cropName'] ?? '');
    if (!cropName) continue;
    if (!salesByCrop[cropName]) salesByCrop[cropName] = [];
    salesByCrop[cropName].push({
      date:       excelDateToIso(r['Data'] ?? r['date']),
      quantity:   Number(r['Quantidade (sacas)'] ?? r['Quantidade'] ?? r['quantity']) || 0,
      avgPrice:   Number(r['Preço Médio (R$/saca)'] ?? r['Preço Médio'] ?? r['avgPrice']) || 0,
      totalValue: Number(r['Valor Total (R$)'] ?? r['Valor Total'] ?? r['totalValue']) || 0,
    });
  }

  // ── Monta crops ──────────────────────────────────────────────────────────
  const crops: CropStockImport[] = stockRows.map(r => {
    const name = getCropName(r);
    // Aceita cores CSS do legado ou usa paleta automática
    const hasLegacyColors = 'color' in r && 'bgColor' in r;
    const colors = hasLegacyColors
      ? { color: String(r['color']), bgColor: String(r['bgColor']) }
      : getCropColor(name);

    return {
      name,
      color:        colors.color,
      bgColor:      colors.bgColor,
      initialStock: getInitialStock(r),
      soldStock:    getSoldStock(r),
      sales:        salesByCrop[name] ?? [],
    };
  });

  return { crops };
}
