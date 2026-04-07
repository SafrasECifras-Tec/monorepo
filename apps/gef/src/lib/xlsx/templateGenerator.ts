import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// Injeção de dataValidations (lista suspensa) via manipulação do XML interno do .xlsx.
// O SheetJS 0.18.x não suporta dataValidations nativamente, então injetamos o XML diretamente.
//
// sheetIndex: índice 1-based da aba no workbook (ordem de criação)
// validations: lista de { sqref, values } a adicionar na aba
async function injectDataValidations(
  xlsxData: Uint8Array,
  validations: Array<{ sheetIndex: number; sqref: string; values: string[] }>
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(xlsxData);

  // Agrupa validações por sheet
  const bySheet = new Map<number, Array<{ sqref: string; values: string[] }>>();
  for (const v of validations) {
    if (!bySheet.has(v.sheetIndex)) bySheet.set(v.sheetIndex, []);
    bySheet.get(v.sheetIndex)!.push({ sqref: v.sqref, values: v.values });
  }

  for (const [sheetIndex, sheetValidations] of bySheet) {
    const path = `xl/worksheets/sheet${sheetIndex}.xml`;
    const file = zip.file(path);
    if (!file) continue;

    const xml = await file.async('string');

    const dvItems = sheetValidations
      .map(({ sqref, values }) => {
        const formula = `"${values.join(',')}"`;
        return `<dataValidation type="list" allowBlank="1" showDropDown="0" sqref="${sqref}"><formula1>${formula}</formula1></dataValidation>`;
      })
      .join('');

    const dvBlock = `<dataValidations count="${sheetValidations.length}">${dvItems}</dataValidations>`;
    const modified = xml.replace('</worksheet>', `${dvBlock}</worksheet>`);
    zip.file(path, modified);
  }

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

async function download(wb: XLSX.WorkBook, filename: string, validations?: Array<{ sheetIndex: number; sqref: string; values: string[] }>) {
  if (!validations || validations.length === 0) {
    XLSX.writeFile(wb, filename);
    return;
  }

  const raw = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
  const withValidations = await injectDataValidations(raw, validations);

  const blob = new Blob([withValidations], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Define larguras de coluna
function setCols(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ─── Template Universal ───────────────────────────────────────────────────────
// Um único arquivo com todas as abas. O sistema detecta automaticamente quais
// módulos importar com base nas abas presentes.
//
// O usuário pode:
//  - Preencher só as abas que precisa (as demais são ignoradas)
//  - Copiar dados do seu sistema de gestão e colar nas abas correspondentes
//  - Deletar as abas que não vai usar

export async function downloadTemplateUniversal() {
  const wb = XLSX.utils.book_new();

  // ══════════════════════════════════════════════════════════════════════════
  // ABA 1 — INSTRUÇÕES (primeira aba, sempre visível)
  // ══════════════════════════════════════════════════════════════════════════
  const wsInstr = XLSX.utils.aoa_to_sheet([
    ['MODELO GEF — GUIA RÁPIDO DE IMPORTAÇÃO'],
    [''],
    ['Como usar este arquivo:'],
    ['  1. Preencha apenas as abas que deseja importar (pode apagar as demais)'],
    ['  2. Não altere o nome das abas — o sistema usa os nomes para identificar o módulo'],
    ['  3. Não altere os cabeçalhos (linha 1) de cada aba'],
    ['  4. Salve como .xlsx antes de importar'],
    [''],
    ['────────────────────────────────────────────────────────────'],
    ['ABA "Parcelas" → Módulo Endividamento'],
    ['────────────────────────────────────────────────────────────'],
    ['  Colunas obrigatórias:'],
    ['    NOME_CREDOR_DEVEDOR  — Nome do banco ou credor'],
    ['    NR_CONTRATO          — Número do contrato'],
    ['    DATA_VENCIMENTO      — Data de vencimento (DD/MM/AAAA ou serial Excel)'],
    ['    TIPO_DIVIDA          — Ex: Investimento, Custeio'],
    ['    DESCRICAO            — Descrição do financiamento'],
    ['    VALOR_AMORTIZACAO    — Valor do principal (amortização)'],
    ['    VALOR_JUROS_ENCARGOS — Valor dos juros e encargos'],
    ['    VALOR_PARCELAS       — Valor total da parcela'],
    ['    TAXA_JURO_MES        — Taxa de juros ao mês (%)'],
    [''],
    ['  Dica: Se você exporta do seu sistema com essas colunas, basta renomear'],
    ['  a aba para "Parcelas" e importar. Linhas com VALOR_PARCELAS vazio são ignoradas.'],
    [''],
    ['────────────────────────────────────────────────────────────'],
    ['ABA "Transações" → Fluxo de Caixa (lançamento a lançamento)'],
    ['────────────────────────────────────────────────────────────'],
    ['  Use quando cada transação tem data e valor individuais.'],
    ['  Colunas obrigatórias:'],
    ['    data         — Data da transação (DD/MM/AAAA)'],
    ['    descricao    — Descrição da transação'],
    ['    categoria    — Categoria (ex: Insumos, Venda de Grãos, Mão de Obra)'],
    ['    valor        — Valor em R$ (positivo para entrada, negativo para saída)'],
    ['    tipo         — "entrada" ou "saída"'],
    ['    status       — "pago", "recebido", "pendente" ou "atrasado"'],
    ['  Colunas opcionais:'],
    ['    subcategoria — Subcategoria para hierarquia no fluxo'],
    ['                   Ex: categoria="Receitas Agrícolas", subcategoria="Soja"'],
    ['  Saldo Inicial (opcional):'],
    ['    Inclua uma linha com descricao="Saldo Inicial" e categoria="Saldo Inicial"'],
    ['    O sistema detecta automaticamente e usa como saldo de abertura do período'],
    [''],
    ['────────────────────────────────────────────────────────────'],
    ['ABA "Fluxo Agregado" → Fluxo de Caixa (lançamento mensal consolidado)'],
    ['────────────────────────────────────────────────────────────'],
    ['  Use quando você já tem dados consolidados por mês (ex: exportação de outro sistema).'],
    ['  Cada linha representa uma categoria inteira em um período — sem datas individuais.'],
    ['  Colunas obrigatórias:'],
    ['    categoria       — Categoria (ex: Venda de Soja, Mão de Obra)'],
    ['    tipo            — "entrada" ou "saída"'],
    ['    tipo_lancamento — "realizado" (meses passados) ou "orçado" (meses futuros)'],
    ['    ano             — Ano de referência (ex: 2026)'],
    ['    jan a dez       — Valor de cada mês (deixe vazio ou 0 para meses sem valor)'],
    ['  Colunas opcionais:'],
    ['    subcategoria    — Subcategoria para hierarquia'],
    ['                      Ex: categoria="Receitas Agrícolas", subcategoria="Soja"'],
    ['  Dica: use linhas "realizado" para meses já encerrados e "orçado" para o futuro.'],
    ['  O sistema combina as duas automaticamente na tabela Realizado/Projetado.'],
    [''],
    ['────────────────────────────────────────────────────────────'],
    ['ABAS "Ativo" e "Passivo" → Módulo Balanço Patrimonial'],
    ['────────────────────────────────────────────────────────────'],
    ['  Colunas estruturais (obrigatórias):'],
    ['    Grupo      — Grupo principal (ex: ATIVO CIRCULANTE)'],
    ['    Subgrupo   — Subcategoria (ex: Financeiro) — opcional'],
    ['    Item       — Item detalhado (ex: Disponível) — opcional'],
    [''],
    ['  Colunas de valor — VOCÊ DEFINE OS NOMES E A QUANTIDADE:'],
    ['    Qualquer coluna que não seja Grupo/Subgrupo/Item é tratada como coluna de valor.'],
    ['    Exemplos válidos (use os nomes que fazem sentido para sua fazenda):'],
    ['      2022/23         2023/24         1ª Avaliação    Visão Atual'],
    ['      2025/26         2026/27         Orçado          Realizado'],
    ['      Balanço Jul/25  Balanço Dez/25  1ª Revisão      2ª Revisão'],
    ['    O sistema exibirá um seletor de coluna automaticamente com os nomes que você definir.'],
    ['    Você pode ter 2, 3, 5 colunas ou mais — não há limite.'],
    [''],
    ['  Regra de nível: só Grupo → nível 0 | Grupo+Subgrupo → nível 1 | todos → nível 2'],
    [''],
    ['────────────────────────────────────────────────────────────'],
    ['ABA "Estoque" → Módulo Estoque'],
    ['────────────────────────────────────────────────────────────'],
    ['  Colunas:'],
    ['    Cultura                — Nome da cultura (ex: Soja, Milho)'],
    ['    Estoque Inicial (sacas)— Quantidade produzida / em estoque'],
    ['    Estoque Vendido (sacas)— Quantidade já comercializada'],
    [''],
    ['ABA "Vendas" → Módulo Estoque (histórico de vendas — opcional)'],
    ['  Colunas: Cultura | Data | Quantidade (sacas) | Preço Médio (R$/saca) | Valor Total (R$)'],
  ]);
  setCols(wsInstr, [80]);
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instruções');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Parcelas" — Endividamento
  // Colunas idênticas ao formato de exportação do sistema de gestão
  // (usuário pode copiar e colar diretamente)
  // ══════════════════════════════════════════════════════════════════════════
  const wsParcelas = XLSX.utils.aoa_to_sheet([
    [
      'NOME_CREDOR_DEVEDOR',
      'NR_CONTRATO',
      'DATA_VENCIMENTO',
      'TIPO_DIVIDA',
      'DESCRICAO',
      'VALOR_AMORTIZACAO',
      'VALOR_JUROS_ENCARGOS',
      'VALOR_PARCELAS',
      'TAXA_JURO_MES',
    ],
    // Exemplos com dados reais do formato esperado
    ['BANCO DO BRASIL SA',                     '40/06228-7',   '15/08/2025', 'Investimento', 'FCO BB PUMA 230 JUROS 5,67',           60000.00,  11582.73,   71582.73,  5.67],
    ['BANCO DO BRASIL SA',                     '40/06228-7',   '16/08/2026', 'Investimento', 'FCO BB PUMA 230 JUROS 5,67',           60000.00,  16191.18,   76191.18,  5.67],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70531323-7',  '10/03/2025', 'Investimento', 'FCO CARLOS CORREC SOLO JUROS 7,23%',   99999.77,  22376.97,  122376.74,  7.23],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/03272-8',   '10/10/2025', 'Custeio',      'Cédula de Crédito',                  6500000.00, 175125.00, 6675125.00,  2.62],
    ['BANCO RABOBANK INTERNATIONAL BRASIL S/A', '88392011',     '10/11/2025', 'Investimento', 'Armazém Grãos 50k',                  1250000.00, 320500.00, 1570500.00, 25.64],
    ['CAIXA ECONOMICA FEDERAL',                 '11092833',     '10/11/2025', 'Custeio',      'Insumos Safra 25/26',                3200000.00, 180000.00, 3380000.00,  5.62],
  ]);
  setCols(wsParcelas, [35, 18, 18, 15, 40, 20, 22, 20, 14]);
  XLSX.utils.book_append_sheet(wb, wsParcelas, 'Parcelas');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Transações" — Fluxo de Caixa (lançamento a lançamento)
  // Coluna subcategoria adicionada entre categoria e valor
  // Colunas: A=data B=descricao C=categoria D=subcategoria E=valor F=tipo G=status
  // ══════════════════════════════════════════════════════════════════════════
  const wsTransacoes = XLSX.utils.aoa_to_sheet([
    ['data',        'descricao',              'categoria',          'subcategoria', 'valor',   'tipo',    'status'],
    ['01/01/2026',  'Saldo Inicial',          'Saldo Inicial',      '',            1500000,   'entrada', 'recebido'],
    ['10/01/2026',  'Venda Soja Jan',         'Receitas Agrícolas', 'Soja',         350000,   'entrada', 'recebido'],
    ['15/01/2026',  'Venda Milho Jan',        'Receitas Agrícolas', 'Milho',        180000,   'entrada', 'recebido'],
    ['15/01/2026',  'Compra Herbicidas',      'Insumos Agrícolas',  'Defensivos',   -42000,   'saída',   'pago'],
    ['05/02/2026',  'Folha de Pagamento',     'Operação',           'Mão de Obra',  -85000,   'saída',   'pago'],
    ['01/03/2026',  'Parcela Financiamento',  'Compromissos Financeiros', '',       -71583,   'saída',   'pago'],
    ['15/03/2026',  'Seguro Agrícola',        'Seguros',            '',             -28000,   'saída',   'pendente'],
  ]);
  setCols(wsTransacoes, [14, 30, 24, 18, 12, 10, 12]);
  XLSX.utils.book_append_sheet(wb, wsTransacoes, 'Transações');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Fluxo Agregado" — Lançamento mensal consolidado
  // Para clientes com dados já consolidados (ex: exportação de outro sistema)
  // Colunas: A=categoria B=subcategoria C=tipo D=tipo_lancamento E=ano F=jan … Q=dez
  // ══════════════════════════════════════════════════════════════════════════
  const wsFluxoAgregado = XLSX.utils.aoa_to_sheet([
    ['categoria',           'subcategoria', 'tipo',    'tipo_lancamento', 'ano',  'jan',   'fev',   'mar',   'abr',  'mai',  'jun',  'jul',  'ago',  'set',  'out',  'nov',  'dez'],
    // Realizados (meses passados — jan a mar como exemplo)
    ['Receitas Agrícolas',  'Soja',         'entrada', 'realizado',       2026,  500000, 450000, 420000,      0,      0,      0,      0,      0,      0,      0,      0,      0],
    ['Receitas Agrícolas',  'Milho',        'entrada', 'realizado',       2026,  180000, 160000, 150000,      0,      0,      0,      0,      0,      0,      0,      0,      0],
    ['Insumos Agrícolas',   'Sementes',     'saída',   'realizado',       2026,   45000,  48000,  52000,      0,      0,      0,      0,      0,      0,      0,      0,      0],
    ['Insumos Agrícolas',   'Defensivos',   'saída',   'realizado',       2026,   38000,  42000,  40000,      0,      0,      0,      0,      0,      0,      0,      0,      0],
    ['Operação',            'Mão de Obra',  'saída',   'realizado',       2026,   80000,  85000,  82000,      0,      0,      0,      0,      0,      0,      0,      0,      0],
    // Orçados (meses futuros — abr a dez como exemplo)
    ['Receitas Agrícolas',  'Soja',         'entrada', 'orçado',          2026,       0,      0,      0, 600000, 580000, 550000, 500000, 480000, 470000, 460000, 450000, 440000],
    ['Receitas Agrícolas',  'Milho',        'entrada', 'orçado',          2026,       0,      0,      0, 200000, 190000, 180000, 175000, 170000, 165000, 160000, 155000, 150000],
    ['Insumos Agrícolas',   'Sementes',     'saída',   'orçado',          2026,       0,      0,      0,  50000,  50000,  50000,  50000,  50000,  50000,  50000,  50000,  50000],
    ['Operação',            'Mão de Obra',  'saída',   'orçado',          2026,       0,      0,      0,  90000,  90000,  90000,  90000,  90000,  90000,  90000,  90000,  90000],
  ]);
  setCols(wsFluxoAgregado, [24, 18, 10, 16, 6, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]);
  XLSX.utils.book_append_sheet(wb, wsFluxoAgregado, 'Fluxo Agregado');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Ativo" — Balanço Patrimonial
  // Formato: Grupo / Subgrupo / Item / valores por safra
  // Muito mais amigável que o formato anterior com id/level/col_xxx
  // ══════════════════════════════════════════════════════════════════════════
  // Colunas de valor são livres — o exemplo usa 5 colunas, mas o usuário pode ter 2, 3, 10, etc.
  const wsAtivo = XLSX.utils.aoa_to_sheet([
    ['Grupo',                   'Subgrupo',       'Item',                 '2022/23',   '2023/24',   '1ª Avaliação', '2ª Avaliação', 'Visão Atual'],
    ['ATIVO CIRCULANTE',        '',               '',                    58980000,    64980000,    70820437,       68500000,       54428694],
    ['ATIVO CIRCULANTE',        'Financeiro',     '',                    14550000,    16050000,    17531756,       20100000,       23346976],
    ['ATIVO CIRCULANTE',        'Financeiro',     'Disponível',            850000,      950000,     1089751,        2500000,        6104999],
    ['ATIVO CIRCULANTE',        'Financeiro',     'Cooperativa',          6500000,     7100000,     7620823,        8200000,        3763555],
    ['ATIVO CIRCULANTE',        'Financeiro',     'Créditos a Receber',   7200000,     8000000,     8821180,        9400000,       13478421],
    ['ATIVO CIRCULANTE',        'Produtos',       '',                    44430000,    48930000,    53288681,       48400000,       31081717],
    ['ATIVO CIRCULANTE',        'Produtos',       'Insumos',              3500000,     3800000,     4087218,        5200000,        6550399],
    ['ATIVO CIRCULANTE',        'Produtos',       'Produto para Venda',   7000000,     8200000,     9059913,       14800000,       17315478],
    ['ATIVO CIRCULANTE',        'Produtos',       'Adiantamentos',       33930000,    36930000,    40141550,       28400000,        7215840],
    ['ATIVO NÃO CIRCULANTE',    '',               '',                   304500000,   320600000,   330182793,      331000000,      332494721],
    ['ATIVO NÃO CIRCULANTE',    'Terras',         '',                   180000000,   190000000,   195600000,      195600000,      195600000],
    ['ATIVO NÃO CIRCULANTE',    'Imobilizado',    '',                    51000000,    53000000,    51700000,       51700000,       51700000],
    ['ATIVO NÃO CIRCULANTE',    'Investimentos',  '',                    73500000,    77600000,    82882793,       83700000,       85194721],
  ]);
  setCols(wsAtivo, [28, 20, 24, 14, 14, 16, 16, 14]);
  XLSX.utils.book_append_sheet(wb, wsAtivo, 'Ativo');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Passivo" — Balanço Patrimonial
  // ══════════════════════════════════════════════════════════════════════════
  const wsPassivo = XLSX.utils.aoa_to_sheet([
    ['Grupo',                        'Subgrupo',               'Item',                     '2022/23',   '2023/24',   '1ª Avaliação', '2ª Avaliação', 'Visão Atual'],
    ['PASSIVO CIRCULANTE',           '',                       '',                         82000000,    75300000,    75291398,       70000000,       62877495],
    ['PASSIVO CIRCULANTE',           'Financeiro',             '',                         64000000,    58200000,    58195062,       61000000,       59574697],
    ['PASSIVO CIRCULANTE',           'Financeiro',             'Custeio Agrícola',         27000000,    27000000,    26973538,       30000000,       32094809],
    ['PASSIVO CIRCULANTE',           'Financeiro',             'Investimento',              3200000,     3500000,     3681066,        4500000,        5982694],
    ['PASSIVO CIRCULANTE',           'Financeiro',             'Financiamentos',           25000000,    20500000,    19477714,       15000000,       12571351],
    ['PASSIVO CIRCULANTE',           'Operacional',            '',                         18000000,    17100000,    17096336,        9000000,        3302798],
    ['PASSIVO CIRCULANTE',           'Operacional',            'Contas a Pagar',            8000000,     7600000,     7596336,        4000000,        1302798],
    ['PASSIVO CIRCULANTE',           'Operacional',            'Fornecedores',             10000000,     9500000,     9500000,        5000000,        2000000],
    ['PASSIVO NÃO CIRCULANTE',       '',                       '',                         95000000,    90000000,    88000000,       72000000,       59133665],
    ['PASSIVO NÃO CIRCULANTE',       'Financiamentos LP',      '',                         95000000,    90000000,    88000000,       72000000,       59133665],
    ['PASSIVO NÃO CIRCULANTE',       'Financiamentos LP',      'Banco da Amazônia',        38000000,    36000000,    35000000,       30000000,       30000000],
    ['PASSIVO NÃO CIRCULANTE',       'Financiamentos LP',      'Banco do Brasil',          57000000,    54000000,    53000000,       42000000,       29133665],
    ['PATRIMÔNIO LÍQUIDO',           '',                       '',                        186480000,   220280000,   237711832,      250000000,      264913551],
  ]);
  setCols(wsPassivo, [28, 24, 26, 14, 14, 16, 16, 14]);
  XLSX.utils.book_append_sheet(wb, wsPassivo, 'Passivo');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "DRE" — Demonstrativo de Resultado
  // ══════════════════════════════════════════════════════════════════════════
  const wsDRE = XLSX.utils.aoa_to_sheet([
    [
      'safra', 'areaTotal', 'producaoTotal', 'produtividadeMedia', 'precoMedioVenda',
      'receitaBruta', 'custoTotal', 'lucroBruto', 'despesasOperacionais', 'ebitda',
      'resultadoLiquido', 'margemBruta', 'margemLiquida', 'pontoEquilibrio', 'roi',
      'orcadoVbp', 'orcadoCusto', 'orcadoResultado',
    ],
    ['2023/24', 2200, 149600, 68.0, 132, 19747200, 14300000, 5447200, 2000000, 4600000,
     3447200, 27.6, 17.5, 46.5, 24.1, 20000000, 15000000, 5000000],
    ['2024/25', 2350, 161650, 68.8, 128, 20691200, 15050000, 5641200, 2200000, 4800000,
     3441200, 27.3, 16.6, 47.2, 22.9, 21500000, 15800000, 5700000],
  ]);
  setCols(wsDRE, [10,10,13,18,16,13,11,11,22,10,15,12,13,15,8,10,11,16]);
  XLSX.utils.book_append_sheet(wb, wsDRE, 'DRE');

  // ── Culturas (opcional) ──────────────────────────────────────────────────
  const wsCulturas = XLSX.utils.aoa_to_sheet([
    ['safra',   'nome',  'area', 'producao', 'produtividade', 'precoMedio',
     'receitaBruta', 'custoTotal', 'margemLiquida', 'variacaoMargem'],
    ['2024/25', 'Soja',   1650, 116820, 70.8, 128, 14952960, 10500000, 29.8,  2.1],
    ['2024/25', 'Milho',   700,  44030, 62.9, 128,  5638240,  4550000, 19.3, -1.2],
    ['2023/24', 'Soja',   1540, 105336, 68.4, 132, 13904352,  9800000, 29.5,  0.0],
    ['2023/24', 'Milho',   660,  44264, 67.1, 132,  5842848,  4500000, 23.0,  1.5],
  ]);
  setCols(wsCulturas, [10,12,8,10,14,12,13,11,14,14]);
  XLSX.utils.book_append_sheet(wb, wsCulturas, 'Culturas');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Estoque" — Posição atual por cultura (sem CSS, sem campos técnicos)
  // ══════════════════════════════════════════════════════════════════════════
  const wsEstoque = XLSX.utils.aoa_to_sheet([
    ['Cultura', 'Estoque Inicial (sacas)', 'Estoque Vendido (sacas)'],
    ['Soja',    120000,  68000],
    ['Milho',    92000,  31000],
    ['Feijão',   18000,   8000],
    ['Trigo',    35000,  12000],
  ]);
  setCols(wsEstoque, [18, 24, 24]);
  XLSX.utils.book_append_sheet(wb, wsEstoque, 'Estoque');

  // ── Vendas (opcional) ────────────────────────────────────────────────────
  const wsVendas = XLSX.utils.aoa_to_sheet([
    ['Cultura', 'Data',        'Quantidade (sacas)', 'Preço Médio (R$/saca)', 'Valor Total (R$)'],
    ['Soja',    '15/06/2026',   20000,  145.00, 2900000],
    ['Soja',    '28/05/2026',   18000,  142.50, 2565000],
    ['Milho',   '22/06/2026',    4000,  135.00,  540000],
    ['Feijão',  '18/06/2026',    3000,  320.00,  960000],
  ]);
  setCols(wsVendas, [18, 14, 22, 24, 18]);
  XLSX.utils.book_append_sheet(wb, wsVendas, 'Vendas');

  // Ordem das abas no workbook (1-based):
  // 1=Instruções, 2=Parcelas, 3=Transações, 4=Fluxo Agregado, 5=Ativo, 6=Passivo, 7=DRE, 8=Culturas, 9=Estoque, 10=Vendas
  await download(wb, 'modelo_gef_universal.xlsx', [
    // Parcelas: TIPO_DIVIDA (coluna D)
    { sheetIndex: 2, sqref: 'D2:D10000', values: ['Investimento', 'Custeio'] },
    // Transações: tipo (coluna F) e status (coluna G) — subcategoria ocupa a coluna D
    { sheetIndex: 3, sqref: 'F2:F10000', values: ['entrada', 'saída'] },
    { sheetIndex: 3, sqref: 'G2:G10000', values: ['pago', 'recebido', 'pendente', 'atrasado'] },
    // Fluxo Agregado: tipo (coluna C) e tipo_lancamento (coluna D)
    { sheetIndex: 4, sqref: 'C2:C10000', values: ['entrada', 'saída'] },
    { sheetIndex: 4, sqref: 'D2:D10000', values: ['realizado', 'orçado'] },
  ]);
}

// ─── Templates individuais (mantidos por compatibilidade) ────────────────────

export async function downloadTemplateFluxoCaixa() { await downloadTemplateUniversal(); }
export async function downloadTemplateEndividamento() { await downloadTemplateUniversal(); }
export async function downloadTemplateBalanco() { await downloadTemplateUniversal(); }
export async function downloadTemplateDRE() { await downloadTemplateUniversal(); }
export async function downloadTemplateEstoque() { await downloadTemplateUniversal(); }
