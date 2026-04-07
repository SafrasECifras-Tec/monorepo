/**
 * parseUniversal.ts
 *
 * Recebe um único workbook (.xlsx) e detecta automaticamente quais abas estão
 * presentes, delegando a parse de cada uma ao parser específico.
 *
 * Abas reconhecidas:
 *   "Transações"     → Fluxo de Caixa (lançamento a lançamento)
 *   "Fluxo Agregado" → Fluxo de Caixa agregado por mês/categoria
 *   "Parcelas"       → Endividamento
 *   "Ativo"          → Balanço Patrimonial (ativo)
 *   "Passivo"        → Balanço Patrimonial (passivo)
 *   "DRE"            → DRE
 *   "Culturas"       → DRE — culturas (opcional, lida pelo parseDRE)
 *   "Estoque"        → Estoque
 *   "Vendas"         → Estoque — vendas (opcional, lida pelo parseEstoque)
 */

import * as XLSX from 'xlsx';
import { parseFluxoCaixa } from './parseFluxoCaixa';
import { parseFluxoAgregado } from './parseFluxoAgregado';
import { parseEndividamento } from './parseEndividamento';
import { parseBalanco } from './parseBalanco';
import { parseDRE } from './parseDRE';
import { parseEstoque } from './parseEstoque';
import type { ImportedDataStore } from '@/contexts/ImportDataContext';

export type ModuleKey = keyof ImportedDataStore;

export interface UniversalParseResult {
  /** Dados prontos para salvar no contexto (apenas módulos detectados) */
  data: Partial<ImportedDataStore>;
  /** Lista dos módulos que foram encontrados e parseados com sucesso */
  modulesFound: ModuleKey[];
  /** Módulos que encontraram erros não-fatais (parse parcial) */
  warnings: string[];
}

const MODULE_LABELS: Record<ModuleKey, string> = {
  fluxoCaixa:    'Fluxo de Caixa',
  fluxoAgregado: 'Fluxo Agregado',
  endividamento: 'Endividamento',
  balanco:       'Balanço Patrimonial',
  dre:           'DRE',
  estoque:       'Estoque',
};

export function getModuleLabel(key: ModuleKey): string {
  return MODULE_LABELS[key] ?? key;
}

export function parseUniversal(wb: XLSX.WorkBook): UniversalParseResult {
  const sheets = new Set(wb.SheetNames);
  const data: Partial<ImportedDataStore> = {};
  const modulesFound: ModuleKey[] = [];
  const warnings: string[] = [];

  const tryParse = (
    moduleKey: ModuleKey,
    condition: boolean,
    parser: () => ImportedDataStore[typeof moduleKey],
  ) => {
    if (!condition) return;
    try {
      const result = parser();
      // Pega invalidCount se presente (retornado por parsers com Object.assign)
      const invalidCount = (result as { invalidCount?: number }).invalidCount ?? 0;
      if (invalidCount > 0) {
        warnings.push(
          `${getModuleLabel(moduleKey)}: ${invalidCount} linha(s) com valores inválidos foram ignoradas.`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any)[moduleKey] = result;
      modulesFound.push(moduleKey);
    } catch (e) {
      warnings.push(`${getModuleLabel(moduleKey)}: ${(e as Error).message}`);
    }
  };

  tryParse('fluxoCaixa',    sheets.has('Transações'),                     () => parseFluxoCaixa(wb) as any);
  tryParse('fluxoAgregado', sheets.has('Fluxo Agregado'),                 () => parseFluxoAgregado(wb) as any);
  tryParse('endividamento',  sheets.has('Parcelas'),                       () => parseEndividamento(wb) as any);
  tryParse('balanco',        sheets.has('Ativo') || sheets.has('Passivo'), () => parseBalanco(wb) as any);
  tryParse('dre',            sheets.has('DRE'),                            () => parseDRE(wb) as any);
  tryParse('estoque',        sheets.has('Estoque'),                        () => parseEstoque(wb) as any);

  return { data, modulesFound, warnings };
}
