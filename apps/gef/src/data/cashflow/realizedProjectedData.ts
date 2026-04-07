export interface CategoryData {
  name: string;
  values: number[];
  isMaster?: boolean;
  isSubMaster?: boolean;
  children?: CategoryData[];
}

// Helper para criar um array zerado de 12 meses
const z = (): number[] => Array(12).fill(0);

/**
 * Retorna estrutura vazia (sem dados) para quando não há importação.
 * Usado como inicializador no lugar de mockData para evitar dados fictícios.
 */
export function emptyData(): CategoryData[] {
  return [
    { name: 'ENTRADAS', isMaster: true, values: z(), children: [] },
    { name: 'SAÍDAS',   isMaster: true, values: z(), children: [] },
  ];
}

/**
 * Constrói CategoryData[] a partir de transações importadas.
 * Meses passados (≤ currentMonth do ano corrente) são preenchidos com dados reais.
 * Meses futuros permanecem com zero (editáveis pelo usuário).
 *
 * Se a transação tiver `subcategoria`, a categoria vira subMaster e a subcategoria
 * vira filho — criando hierarquia automaticamente.
 */
export function buildMonthlyFromTransactions(transactions: Array<{
  data: string;
  categoria: string;
  subcategoria?: string; // opcional — habilita hierarquia categoria/subcategoria
  valor: number;
  tipo: 'entrada' | 'saida';
}>): CategoryData[] {
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  // Mapa aninhado: categoria → subcategoria → valores[12]
  // Subcategoria '' (string vazia) = transação sem subcategoria (filho direto da categoria)
  type SubcatMap = Record<string, Record<string, number[]>>;
  const entradaMap: SubcatMap = {};
  const saidaMap:   SubcatMap = {};

  transactions.forEach(t => {
    const parts = t.data.split('-');
    const year  = parseInt(parts[0] ?? '0');
    const month = parseInt(parts[1] ?? '1') - 1;
    if (year !== currentYear || month < 0 || month > currentMonth) return;

    const map    = t.tipo === 'entrada' ? entradaMap : saidaMap;
    const subcat = t.subcategoria?.trim() ?? ''; // '' = sem subcategoria

    if (!map[t.categoria])         map[t.categoria]         = {};
    if (!map[t.categoria][subcat]) map[t.categoria][subcat] = Array(12).fill(0);
    map[t.categoria][subcat][month] += Math.abs(t.valor);
  });

  /**
   * Converte o mapa aninhado em CategoryData[]:
   * - Categorias com subcategorias → subMaster + filhos
   * - Categorias sem subcategorias → filho direto (comportamento anterior)
   */
  const buildChildren = (map: SubcatMap): CategoryData[] => {
    const result: CategoryData[] = [];

    Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([catName, subcatEntries]) => {
        const subcatKeys = Object.keys(subcatEntries);
        const hasSubcat  = subcatKeys.some(k => k !== '');

        if (hasSubcat) {
          // categoria → subMaster; subcategorias → filhos
          const children: CategoryData[] = subcatKeys
            .filter(k => k !== '')
            .sort((a, b) => a.localeCompare(b))
            .map(k => ({ name: k, values: subcatEntries[k] }));

          // Transações sem subcategoria ficam agrupadas em "Outros" dentro do subMaster
          if (subcatEntries['']) {
            children.push({ name: `${catName} - Outros`, values: subcatEntries[''] });
          }

          const subMasterValues = Array(12).fill(0).map((_, i) =>
            children.reduce((sum, c) => sum + c.values[i], 0)
          );
          result.push({ name: catName, isSubMaster: true, values: subMasterValues });
          result.push(...children);
        } else {
          // Sem subcategoria → filho direto (compatibilidade com planilhas anteriores)
          result.push({ name: catName, values: subcatEntries[''] ?? Array(12).fill(0) });
        }
      });

    return result;
  };

  const masterSum = (children: CategoryData[]) =>
    Array(12).fill(0).map((_, i) =>
      children.filter(c => !c.isSubMaster).reduce((s, c) => s + c.values[i], 0)
    );

  const entradaChildren = buildChildren(entradaMap);
  const saidaChildren   = buildChildren(saidaMap);

  return [
    { name: 'ENTRADAS', isMaster: true, values: masterSum(entradaChildren), children: entradaChildren },
    { name: 'SAÍDAS',   isMaster: true, values: masterSum(saidaChildren),   children: saidaChildren   },
  ];
}

/**
 * Constrói CategoryData[] a partir de lançamentos agregados (um por mês/categoria).
 * Usado para clientes com dados já consolidados que importam via aba "Fluxo Agregado".
 *
 * Lógica realizado/orçado:
 *   - Linhas `realizado` → preenchem meses passados (0..currentMonth)
 *   - Linhas `orçado`    → preenchem meses futuros (currentMonth+1..11)
 *
 * Se subcategoria presente: categoria vira subMaster, subcategoria vira filho.
 */
export function buildMonthlyFromAggregated(
  rows: import('@/contexts/ImportDataContext').AggregatedFlowRow[],
  currentYear?: number,
  currentMonth?: number,
): CategoryData[] {
  const year  = currentYear  ?? new Date().getFullYear();
  const month = currentMonth ?? new Date().getMonth(); // 0-indexed

  // Chave composta para garantir unicidade: `categoria::subcategoria`
  type EntryKey = string;
  const entradaMap = new Map<EntryKey, { categoria: string; subcategoria?: string; values: number[] }>();
  const saidaMap   = new Map<EntryKey, { categoria: string; subcategoria?: string; values: number[] }>();

  rows
    .filter(r => r.ano === year)
    .forEach(r => {
      const key = `${r.categoria}::${r.subcategoria ?? ''}`;
      const map = r.tipo === 'entrada' ? entradaMap : saidaMap;

      if (!map.has(key)) {
        map.set(key, { categoria: r.categoria, subcategoria: r.subcategoria, values: Array(12).fill(0) });
      }
      const entry = map.get(key)!;

      r.valores.forEach((v, i) => {
        const usarRealizado = r.tipoLancamento === 'realizado' && i <= month;
        const usarOrcado    = r.tipoLancamento === 'orcado'    && i >  month;
        if (usarRealizado || usarOrcado) {
          entry.values[i] += Math.abs(v);
        }
      });
    });

  /**
   * Converte o Map em CategoryData[], agrupando por categoria.
   * Se subcategoria presente: categoria → subMaster, subcategoria → filho.
   */
  const buildChildren = (
    map: Map<EntryKey, { categoria: string; subcategoria?: string; values: number[] }>
  ): CategoryData[] => {
    // Agrupa por categoria mantendo ordem de inserção original do cliente
    const categoriaGroups = new Map<string, Array<{ subcategoria?: string; values: number[] }>>();
    for (const entry of map.values()) {
      if (!categoriaGroups.has(entry.categoria)) categoriaGroups.set(entry.categoria, []);
      categoriaGroups.get(entry.categoria)!.push({ subcategoria: entry.subcategoria, values: entry.values });
    }

    const result: CategoryData[] = [];
    for (const [catName, items] of Array.from(categoriaGroups.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const hasSubcat = items.some(i => i.subcategoria);

      if (hasSubcat) {
        const children: CategoryData[] = items
          .sort((a, b) => (a.subcategoria ?? '').localeCompare(b.subcategoria ?? ''))
          .map(i => ({ name: i.subcategoria ?? catName, values: i.values }));

        const subMasterValues = Array(12).fill(0).map((_, idx) =>
          children.reduce((sum, c) => sum + c.values[idx], 0)
        );
        result.push({ name: catName, isSubMaster: true, values: subMasterValues });
        result.push(...children);
      } else {
        // Sem subcategoria → filho direto (soma caso haja múltiplas linhas para a mesma categoria)
        const merged = items.reduce<number[]>(
          (acc, i) => acc.map((v, idx) => v + i.values[idx]),
          Array(12).fill(0)
        );
        result.push({ name: catName, values: merged });
      }
    }
    return result;
  };

  const masterSum = (children: CategoryData[]) =>
    Array(12).fill(0).map((_, i) =>
      children.filter(c => !c.isSubMaster).reduce((s, c) => s + c.values[i], 0)
    );

  const entradaChildren = buildChildren(entradaMap);
  const saidaChildren   = buildChildren(saidaMap);

  return [
    { name: 'ENTRADAS', isMaster: true, values: masterSum(entradaChildren), children: entradaChildren },
    { name: 'SAÍDAS',   isMaster: true, values: masterSum(saidaChildren),   children: saidaChildren },
  ];
}

export const recalculateData = (data: CategoryData[]): CategoryData[] => {
  return data.map(master => {
    if (!master.children) return master;
    const newChildren = [...master.children].map(c => ({ ...c, values: [...c.values] }));
    const length = newChildren[0]?.values.length || 12;
    let currentSubMasterIndex = -1;
    for (let i = 0; i < newChildren.length; i++) {
      if (newChildren[i].isSubMaster) {
        currentSubMasterIndex = i;
        newChildren[currentSubMasterIndex].values = new Array(length).fill(0);
      } else if (currentSubMasterIndex !== -1) {
        newChildren[i].values.forEach((v, idx) => {
          newChildren[currentSubMasterIndex].values[idx] += v;
        });
      }
    }
    const masterSums = new Array(length).fill(0);
    newChildren.forEach(child => {
      if (!child.isSubMaster) child.values.forEach((v, idx) => (masterSums[idx] += v));
    });
    return { ...master, values: masterSums, children: newChildren };
  });
};

export const generateAnnualData = (monthlyData: CategoryData[]): CategoryData[] => {
  return monthlyData.map(master => {
    const masterSum = master.values.reduce((a, b) => a + b, 0);
    return {
      ...master,
      values: [masterSum, masterSum, masterSum, masterSum, masterSum],
      children: master.children?.map(child => {
        const childSum = child.values.reduce((a, b) => a + b, 0);
        return { ...child, values: [childSum, childSum, childSum, childSum, childSum] };
      }),
    };
  });
};

export const mockData: CategoryData[] = [
  // ─── ENTRADAS ───────────────────────────────────────────────────────────────
  {
    name: 'ENTRADAS',
    isMaster: true,
    values: [650000, 450000, 850000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    children: [
      { name: 'Venda de Soja',                          values: [300000, 200000, 150000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Venda de Milho',                         values: [150000, 100000,  50000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Venda de Sorgo',                         values: z() },
      { name: 'Venda de Animais',                       values: z() },
      { name: 'Venda de outros Produtos',               values: z() },
      { name: 'Venda de Veículos/Máquinas/Equipamentos',values: [ 50000,  50000,  50000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Recebimento Indenização Seguros',         values: z() },
      { name: 'Prestação de Serviços a Terceiros',       values: z() },
      { name: 'Outras Receitas',                         values: z() },

      // Sub-grupo: Entrada de Crédito
      { name: 'Entrada de Crédito',  isSubMaster: true, values: [0, 0, 500000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Receitas de Custeios',                   values: [0, 0, 500000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Receitas de Financiamentos',             values: z() },
      { name: 'Receitas de Empréstimos',                values: z() },
    ],
  },

  // ─── SAÍDAS ─────────────────────────────────────────────────────────────────
  {
    name: 'SAÍDAS',
    isMaster: true,
    values: [550000, 650000, 850000, 428000, 428000, 367000, 367000, 367000, 582000, 428000, 0, 0],
    children: [

      // Sub-grupo: Insumos Agrícolas
      { name: 'Insumos Agrícolas', isSubMaster: true,   values: [250000, 350000, 450000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Sementes',                               values: [ 50000,  70000,  90000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Fertilizantes',                          values: [ 50000,  70000,  90000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Defensivos',                             values: [ 50000,  70000,  90000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Corretivos',                             values: [ 50000,  70000,  90000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Insumos Gerais',                         values: [ 50000,  70000,  90000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },

      // Sub-grupo: Insumos Pecuários
      { name: 'Insumos Pecuários', isSubMaster: true,   values: [200000, 200000, 300000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Aquisição de Animais',                   values: [ 30000,  30000,  40000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Frete Bovinos',                          values: [ 30000,  30000,  40000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Suplementação Alimentar',                values: [ 30000,  30000,  40000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Produtos Veterinários',                  values: [ 30000,  30000,  40000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Pastagem',                               values: [ 30000,  30000,  40000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Silagem',                                values: [ 25000,  25000,  30000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Inseminação/Reprodução',                 values: [ 25000,  25000,  30000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },

      // Sub-grupo: Operação
      { name: 'Operação', isSubMaster: true,            values: z() },
      { name: 'Mão de Obra',                            values: [ 50000,  50000,  50000,  50000,  50000, 100000, 100000, 100000, 100000,  50000,  50000, 100000] },
      { name: 'Combustíveis e Lubrificantes',           values: [ 50000,  50000,  50000,  50000,  50000, 100000, 100000, 100000, 100000,  50000,  50000, 100000] },
      { name: 'Manutenção de Máquinas e Equipamentos',  values: [ 20000,  20000,  20000,  20000,  20000,  40000,  40000,  40000,  40000,  20000,  20000,  40000] },
      { name: 'Manutenção de Benfeitorias e Aramados',  values: [ 10000,  10000,  10000,  10000,  10000,  15000,  15000,  15000,  15000,  10000,  10000,  15000] },
      { name: 'Serviços de Terceiros',                  values: [ 15000,  15000,  15000,  15000,  15000,  30000,  30000,  30000,  30000,  15000,  15000,  30000] },
      { name: 'Aplicação Aérea',                        values: [     0,      0,      0,  40000,  40000,      0,      0,      0,  40000,  40000,      0,      0] },
      { name: 'Secagem e Armazenagem',                  values: [     0,      0,      0,  25000,  25000,      0,      0,      0,  25000,  25000,      0,      0] },
      { name: 'Máquinas Terceirizadas',                 values: [ 10000,  10000,  10000,  10000,  10000,  20000,  20000,  20000,  20000,  10000,  10000,  20000] },
      { name: 'Despesas com veículos',                  values: [  8000,   8000,   8000,   8000,   8000,  12000,  12000,  12000,  12000,   8000,   8000,  12000] },
      { name: 'Impostos e Taxas',                       values: [  5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000] },
      { name: 'Irrigação',                              values: [ 12000,  12000,  12000,  12000,  12000,  12000,  12000,  12000,  12000,  12000,  12000,  12000] },
      { name: 'Juros e Variações Monetárias',           values: [  3000,   3000,   3000,   3000,   3000,   3000,   3000,   3000,   3000,   3000,   3000,   3000] },
      { name: 'Administração',                          values: [ 25000,  25000,  25000,  25000,  25000,  25000,  25000,  25000,  25000,  25000,  25000,  25000] },
      { name: 'Outros - Operação',                      values: [  5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000,   5000] },
      { name: 'Arrendamentos',                          values: [     0,      0,      0, 150000, 150000,      0,      0,      0, 150000, 150000,      0,      0] },

      // Sub-grupo: Investimentos Pagos em Produto (scs)
      { name: 'Investimentos Pagos em Produto (scs)', isSubMaster: true, values: z() },
      { name: 'Investimentos pagos em Soja (scs)',      values: z() },
      { name: 'Investimentos pagos em Milho (scs)',     values: z() },

      // Sub-grupo: Investimentos
      { name: 'Investimentos', isSubMaster: true,       values: z() },
      { name: 'Compra de Área',                         values: z() },
      { name: 'Investimentos em Benfeitorias',          values: z() },
      { name: 'Investimentos em Maquinário',            values: z() },
      { name: 'Investimentos em Veículos',              values: z() },
      { name: 'Investimentos em Irrigação',             values: z() },
      { name: 'Outros Investimentos',                   values: z() },

      // Sub-grupo: Compromissos Financeiros
      { name: 'Compromissos Financeiros', isSubMaster: true, values: [0, 0, 100000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Parcelas de Financiamentos',             values: [     0,      0,  80000,      0,      0,      0,      0,      0,      0,      0,      0,      0] },
      { name: 'Parcelas de Custeios',                   values: z() },
      { name: 'Parcelas de Empréstimos',                values: [     0,      0,  20000,      0,      0,      0,      0,      0,      0,      0,      0,      0] },
      { name: 'Retirada de Dividendos',                 values: z() },
      { name: 'Retiradas Particulares',                 values: z() },
      { name: 'Compra de Imóveis Particulares',         values: z() },
      { name: 'Distribuição de Lucros',                 values: z() },
    ],
  },
];
