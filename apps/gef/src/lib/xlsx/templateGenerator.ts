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
    // ── Histórico 2020/21 (~48,5M) ───────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/01100-2',   '10/08/2020', 'Custeio',           'CPR Custeio Soja/Milho 20/21',       8500000.00, 765000.00,  9265000.00,  3.00],
    ['BANCO DO BRASIL SA',                     '40/01101-0',   '15/08/2020', 'Compra de Terras',  'FCO Aquisição Terra Gleba Norte',    5200000.00, 676000.00,  5876000.00,  4.33],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/01872-3',   '10/09/2020', 'Custeio',           'Cédula de Crédito Safra 20/21',      7200000.00, 576000.00,  7776000.00,  2.67],
    ['BANCO RABOBANK INTERNATIONAL BRASIL S/A', '88001210',     '20/09/2020', 'Investimento',      'Financiamento Silo 30k t',           4800000.00, 998400.00,  5798400.00,  6.93],
    ['CAIXA ECONOMICA FEDERAL',                 '11000100',     '10/10/2020', 'Compra de Terras',  'Financiamento Gleba Sul PRONAF',     5600000.00, 728000.00,  6328000.00,  4.33],
    ['BANCO DO BRASIL SA',                     '40/01200-9',   '10/11/2020', 'Investimento',      'Moderfrota Trator + Implementos',    3500000.00, 630000.00,  4130000.00,  6.00],
    ['SICREDI CENTRO SUL MS',                  'SC20/00812',   '10/12/2020', 'Custeio',           'Crédito Custeio Insumos 20/21',      4200000.00, 378000.00,  4578000.00,  3.00],
    ['BANCO DA AMAZONIA SA',                   'BASA/002210',  '15/03/2021', 'Investimento',      'FNO Armazém e Beneficiamento',       3500000.00, 787500.00,  4287500.00,  7.50],
    ['BANCO BRADESCO SA',                      'BD20/44312',   '10/04/2021', 'Custeio',           'Adiantamento Contrato Soja',         5200000.00, 468000.00,  5668000.00,  3.00],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500001-1',  '10/05/2021', 'Investimento',      'FCO Correção Solo e Drenagem',         800000.00, 176000.00,   976000.00,  7.33],
    // ── Histórico 2021/22 (~45M) ─────────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/02100-8',   '10/08/2021', 'Custeio',           'CPR Custeio Soja/Milho 21/22',       7800000.00, 702000.00,  8502000.00,  3.00],
    ['BANCO DO BRASIL SA',                     '40/02101-6',   '15/08/2021', 'Compra de Terras',  'FCO Aquisição Terra Gleba Leste',    4600000.00, 598000.00,  5198000.00,  4.33],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/02872-1',   '10/09/2021', 'Custeio',           'Cédula de Crédito Safra 21/22',      6500000.00, 520000.00,  7020000.00,  2.67],
    ['BANCO RABOBANK INTERNATIONAL BRASIL S/A', '88002112',     '20/09/2021', 'Investimento',      'Ampliação Silo e Secador',           3800000.00, 760000.00,  4560000.00,  6.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11001100',     '10/10/2021', 'Compra de Terras',  'Financiamento Área Expansão 21/22',  4800000.00, 624000.00,  5424000.00,  4.33],
    ['BANCO DO BRASIL SA',                     '40/02200-4',   '10/11/2021', 'Investimento',      'Moderfrota Colheitadeira',           3200000.00, 576000.00,  3776000.00,  6.00],
    ['SICREDI CENTRO SUL MS',                  'SC21/01022',   '10/12/2021', 'Custeio',           'Crédito Custeio Insumos 21/22',      3800000.00, 342000.00,  4142000.00,  3.00],
    ['BANCO DA AMAZONIA SA',                   'BASA/003211',  '15/03/2022', 'Investimento',      'FNO Infraestrutura Rural',           3000000.00, 675000.00,  3675000.00,  7.50],
    ['BANCO BRADESCO SA',                      'BD21/55412',   '10/04/2022', 'Custeio',           'Adiantamento Contrato Soja 21/22',   4500000.00, 405000.00,  4905000.00,  3.00],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500002-9',  '10/05/2022', 'Investimento',      'FCO Pivot Central',                  2000000.00, 440000.00,  2440000.00,  7.33],
    // ── Histórico 2022/23 (~37,4M) ───────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/03100-5',   '10/08/2022', 'Custeio',           'CPR Custeio Soja/Milho 22/23',       6200000.00, 558000.00,  6758000.00,  3.00],
    ['BANCO DO BRASIL SA',                     '40/03101-3',   '15/08/2022', 'Compra de Terras',  'FCO Regularização Área 22/23',       3200000.00, 416000.00,  3616000.00,  4.33],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/03272-8',   '10/09/2022', 'Custeio',           'Cédula de Crédito Safra 22/23',      5800000.00, 464000.00,  6264000.00,  2.67],
    ['BANCO RABOBANK INTERNATIONAL BRASIL S/A', '88002812',     '20/09/2022', 'Investimento',      'Financiamento Retroescavadeira',     1800000.00, 360000.00,  2160000.00,  6.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11002100',     '10/10/2022', 'Compra de Terras',  'Financiamento Gleba Oeste 22/23',    3600000.00, 468000.00,  4068000.00,  4.33],
    ['BANCO DO BRASIL SA',                     '40/03200-1',   '10/11/2022', 'Investimento',      'Moderfrota Pulverizador',            2200000.00, 396000.00,  2596000.00,  6.00],
    ['SICREDI CENTRO SUL MS',                  'SC22/01533',   '10/12/2022', 'Custeio',           'Crédito Custeio Insumos 22/23',      3200000.00, 288000.00,  3488000.00,  3.00],
    ['BANCO DA AMAZONIA SA',                   'BASA/004212',  '15/03/2023', 'Investimento',      'FNO Energia Solar Fazenda',          1800000.00, 405000.00,  2205000.00,  7.50],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500003-7',  '10/05/2023', 'Investimento',      'FCO Terraplanagem',                  1200000.00, 264000.00,  1464000.00,  7.33],
    // ── Histórico 2023/24 (~21,6M) ───────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/04100-1',   '10/08/2023', 'Custeio',           'CPR Custeio Soja/Milho 23/24',       4800000.00, 432000.00,  5232000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/04272-5',   '10/09/2023', 'Custeio',           'Cédula de Crédito Safra 23/24',      3800000.00, 304000.00,  4104000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11003100',     '10/10/2023', 'Compra de Terras',  'Financiamento Remanescente Gleba',   3200000.00, 416000.00,  3616000.00,  4.33],
    ['BANCO DO BRASIL SA',                     '40/04200-8',   '10/11/2023', 'Investimento',      'Moderfrota Transbordo + Carreta',    1600000.00, 288000.00,  1888000.00,  6.00],
    ['SICREDI CENTRO SUL MS',                  'SC23/02044',   '10/12/2023', 'Custeio',           'Crédito Custeio Insumos 23/24',      2800000.00, 252000.00,  3052000.00,  3.00],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500004-5',  '10/04/2024', 'Investimento',      'FCO Irrigação Pivô 2',               1600000.00, 352000.00,  1952000.00,  7.33],
    ['BANCO DA AMAZONIA SA',                   'BASA/005213',  '15/05/2024', 'Investimento',      'FNO Beneficiamento Algodão',         1500000.00, 337500.00,  1837500.00,  7.50],
    // ── Histórico 2024/25 (~18,2M) ───────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/05100-8',   '10/08/2024', 'Custeio',           'CPR Custeio Soja/Milho 24/25',       3800000.00, 342000.00,  4142000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/05272-2',   '10/09/2024', 'Custeio',           'Cédula de Crédito Safra 24/25',      3200000.00, 256000.00,  3456000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11004100',     '10/10/2024', 'Compra de Terras',  'Parcela Financiamento Gleba Norte',  2800000.00, 364000.00,  3164000.00,  4.33],
    ['BANCO DO BRASIL SA',                     '40/05200-4',   '10/11/2024', 'Investimento',      'Manutenção Frota e Implementos',     1200000.00, 216000.00,  1416000.00,  6.00],
    ['SICREDI CENTRO SUL MS',                  'SC24/02555',   '10/12/2024', 'Custeio',           'Crédito Custeio Insumos 24/25',      2400000.00, 216000.00,  2616000.00,  3.00],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500005-3',  '10/04/2025', 'Investimento',      'FCO Correção Solo Safra 25',           900000.00, 198000.00,  1098000.00,  7.33],
    ['BANCO RABOBANK INTERNATIONAL BRASIL S/A', '88005025',     '10/06/2025', 'Investimento',      'Financiamento Drone Agrícola',         600000.00, 144000.00,   744000.00,  8.00],
    // ── Posição atual 2025/26 (~15,7M) ───────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/06100-3',   '10/08/2025', 'Custeio',           'CPR Custeio Soja/Milho 25/26',       3200000.00, 288000.00,  3488000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/06272-4',   '10/09/2025', 'Custeio',           'Cédula de Crédito Safra 25/26',      2600000.00, 208000.00,  2808000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11005100',     '10/10/2025', 'Compra de Terras',  'Parcela Financiamento Gleba Sul',    2400000.00, 312000.00,  2712000.00,  4.33],
    ['BANCO DO BRASIL SA',                     '40/06228-7',   '15/08/2025', 'Investimento',      'FCO BB PUMA 230 JUROS 5,67',           60000.00,  11582.73,     71582.73,  5.67],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70531323-7',  '10/03/2025', 'Investimento',      'FCO Correção Solo Juros 7,23%',        99999.77,  22376.97,   122376.74,  7.23],
    ['BANCO RABOBANK INTERNATIONAL BRASIL S/A', '88392011',     '10/11/2025', 'Investimento',      'Armazém Grãos 50k',                 1250000.00, 320500.00,  1570500.00, 25.64],
    ['CAIXA ECONOMICA FEDERAL',                 '11092833',     '10/11/2025', 'Custeio',           'Insumos Safra 25/26',               3200000.00, 180000.00,  3380000.00,  5.62],
    ['SICREDI CENTRO SUL MS',                  'SC25/03066',   '10/12/2025', 'Custeio',           'Crédito Custeio Insumos 25/26',      1800000.00, 162000.00,  1962000.00,  3.00],
    ['BANCO DO BRASIL SA',                     '40/06228-7',   '16/08/2026', 'Investimento',      'FCO BB PUMA 230 JUROS 5,67',           60000.00,  16191.18,     76191.18,  5.67],
    // ── Projeção 2026/27 (~12M) ───────────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/07100-0',   '10/08/2026', 'Custeio',           'CPR Custeio Soja/Milho 26/27',       2600000.00, 234000.00,  2834000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/07272-1',   '10/09/2026', 'Custeio',           'Cédula de Crédito Safra 26/27',      2000000.00, 160000.00,  2160000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11006100',     '10/10/2026', 'Compra de Terras',  'Parcela Financiamento Área 26/27',   2000000.00, 260000.00,  2260000.00,  4.33],
    ['SICREDI CENTRO SUL MS',                  'SC26/03577',   '10/12/2026', 'Custeio',           'Crédito Custeio Insumos 26/27',      1600000.00, 144000.00,  1744000.00,  3.00],
    ['BANCO DO BRASIL SA',                     '40/07200-7',   '10/11/2026', 'Investimento',      'Amortização Moderfrota 26/27',        900000.00, 162000.00,  1062000.00,  6.00],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500006-1',  '10/05/2027', 'Investimento',      'FCO Saldo Irrigação Pivô 2',          600000.00, 132000.00,   732000.00,  7.33],
    // ── Projeção 2027/28 (~9M) ────────────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/08100-6',   '10/08/2027', 'Custeio',           'CPR Custeio Soja/Milho 27/28',       1900000.00, 171000.00,  2071000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/08272-7',   '10/09/2027', 'Custeio',           'Cédula de Crédito Safra 27/28',      1600000.00, 128000.00,  1728000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11007100',     '10/10/2027', 'Compra de Terras',  'Parcela Financiamento Área 27/28',   1800000.00, 234000.00,  2034000.00,  4.33],
    ['SICREDI CENTRO SUL MS',                  'SC27/04088',   '10/12/2027', 'Custeio',           'Crédito Custeio Insumos 27/28',      1200000.00, 108000.00,  1308000.00,  3.00],
    ['BANCO DO BRASIL SA',                     '40/08200-3',   '10/11/2027', 'Investimento',      'Amortização Moderfrota 27/28',        600000.00, 108000.00,   708000.00,  6.00],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500007-0',  '10/05/2028', 'Investimento',      'FCO Saldo Armazém 27/28',             400000.00,  88000.00,   488000.00,  7.33],
    // ── Projeção 2028/29 (~6,8M) ─────────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/09100-2',   '10/08/2028', 'Custeio',           'CPR Custeio Soja/Milho 28/29',       1400000.00, 126000.00,  1526000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/09272-3',   '10/09/2028', 'Custeio',           'Cédula de Crédito Safra 28/29',      1200000.00,  96000.00,  1296000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11008100',     '10/10/2028', 'Compra de Terras',  'Parcela Financiamento Área 28/29',   1500000.00, 195000.00,  1695000.00,  4.33],
    ['SICREDI CENTRO SUL MS',                  'SC28/04599',   '10/12/2028', 'Custeio',           'Crédito Custeio Insumos 28/29',       900000.00,  81000.00,   981000.00,  3.00],
    ['BANCO DO BRASIL SA',                     '40/09200-9',   '10/11/2028', 'Investimento',      'Amortização Equipamentos 28/29',      400000.00,  72000.00,   472000.00,  6.00],
    // ── Projeção 2029/30 (~5M) ────────────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/10100-9',   '10/08/2029', 'Custeio',           'CPR Custeio Soja/Milho 29/30',       1000000.00,  90000.00,  1090000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/10272-0',   '10/09/2029', 'Custeio',           'Cédula de Crédito Safra 29/30',       900000.00,  72000.00,   972000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11009100',     '10/10/2029', 'Compra de Terras',  'Parcela Financiamento Área 29/30',   1200000.00, 156000.00,  1356000.00,  4.33],
    ['SICREDI CENTRO SUL MS',                  'SC29/05100',   '10/12/2029', 'Custeio',           'Crédito Custeio Insumos 29/30',       600000.00,  54000.00,   654000.00,  3.00],
    ['COOPERATIVA DE CREDITO CELEIRO',          'B70500008-8',  '10/05/2030', 'Investimento',      'FCO Saldo Remanescente 29/30',        300000.00,  66000.00,   366000.00,  7.33],
    // ── Projeção 2030/31 (~3M) ────────────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/11100-5',   '10/08/2030', 'Custeio',           'CPR Custeio Soja/Milho 30/31',        700000.00,  63000.00,   763000.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/11272-6',   '10/09/2030', 'Custeio',           'Cédula de Crédito Safra 30/31',       600000.00,  48000.00,   648000.00,  2.67],
    ['CAIXA ECONOMICA FEDERAL',                 '11010100',     '10/10/2030', 'Compra de Terras',  'Parcela Final Financiamento',         900000.00, 117000.00,  1017000.00,  4.33],
    ['SICREDI CENTRO SUL MS',                  'SC30/05611',   '10/12/2030', 'Custeio',           'Crédito Custeio Insumos 30/31',       400000.00,  36000.00,   436000.00,  3.00],
    // ── Projeção 2031/32 (~1,5M) ─────────────────────────────────────────────
    ['BANCO DO BRASIL SA',                     '40/12100-1',   '10/08/2031', 'Custeio',           'CPR Custeio Soja/Milho 31/32',        400000.00,  36000.00,   436000.00,  3.00],
    ['CAIXA ECONOMICA FEDERAL',                 '11011100',     '10/10/2031', 'Compra de Terras',  'Parcela Final Gleba Norte',           600000.00,  78000.00,   678000.00,  4.33],
    ['SICREDI CENTRO SUL MS',                  'SC31/06122',   '10/12/2031', 'Custeio',           'Crédito Custeio Insumos 31/32',       250000.00,  22500.00,   272500.00,  3.00],
    ['BANCO SANTANDER (BRASIL) S.A.',           '40/12272-2',   '10/03/2032', 'Custeio',           'Liquidação Final Cédula 31/32',       200000.00,  16000.00,   216000.00,  2.67],
  ]);
  setCols(wsParcelas, [35, 18, 18, 15, 40, 20, 22, 20, 14]);
  XLSX.utils.book_append_sheet(wb, wsParcelas, 'Parcelas');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Transações" — Fluxo de Caixa (lançamento a lançamento)
  // Coluna subcategoria adicionada entre categoria e valor
  // Colunas: A=data B=descricao C=categoria D=subcategoria E=valor F=tipo G=status
  // ══════════════════════════════════════════════════════════════════════════
  const wsTransacoes = XLSX.utils.aoa_to_sheet([
    ['data',        'descricao',                              'categoria',                 'subcategoria',    'valor',    'tipo',    'status'],
    // ── Janeiro ──────────────────────────────────────────────────────────────
    ['01/01/2026',  'Saldo Inicial',                          'Saldo Inicial',              '',              1500000,   'entrada', 'recebido'],
    ['05/01/2026',  'Venda Soja — Lote 1 (1.200 sc)',         'Soja',                       '',               156000,   'entrada', 'recebido'],
    ['08/01/2026',  'Venda Soja — Lote 2 (800 sc)',           'Soja',                       '',               104000,   'entrada', 'recebido'],
    ['10/01/2026',  'Venda Milho — Lote 1 (3.000 sc)',        'Milho',                      '',                90000,   'entrada', 'recebido'],
    ['10/01/2026',  'Venda Milho Safrinha — Lote 1',          'Milho Safrinha',             '',               200000,   'entrada', 'recebido'],
    ['12/01/2026',  'Compra Fertilizante MAP',                 'Insumos Agrícolas',          'Fertilizantes',  -98000,   'saída',   'pago'],
    ['12/01/2026',  'Compra Herbicida Roundup',                'Insumos Agrícolas',          'Defensivos',     -42000,   'saída',   'pago'],
    ['15/01/2026',  'Folha de Pagamento Jan',                  'Operação',                   'Mão de Obra',    -85000,   'saída',   'pago'],
    ['15/01/2026',  'Combustível — Diesel s-10 (12.000 L)',    'Operação',                   'Combustível',    -75600,   'saída',   'pago'],
    ['15/01/2026',  'Parcela BB — FCO PUMA 230',               'Compromissos Financeiros',   'Financiamentos', -71583,   'saída',   'pago'],
    ['18/01/2026',  'Manutenção Colheitadeira',                'Operação',                   'Manutenção',     -34000,   'saída',   'pago'],
    ['20/01/2026',  'Arrendamento Jan — Gleba Norte',          'Compromissos Financeiros',   'Arrendamentos',  -48000,   'saída',   'pago'],
    ['22/01/2026',  'Venda Soja — Lote 3 (1.500 sc)',          'Soja',                       '',               195000,   'entrada', 'recebido'],
    ['25/01/2026',  'Conta de Energia — Pivô',                 'Operação',                   'Energia',        -22000,   'saída',   'pago'],
    ['28/01/2026',  'Seguro Agrícola — Parcela 1/6',           'Seguros',                    '',               -28000,   'saída',   'pago'],
    ['30/01/2026',  'Adiantamento Fornecedor Sementes',        'Insumos Agrícolas',          'Sementes',       -60000,   'saída',   'pago'],
    // ── Fevereiro ─────────────────────────────────────────────────────────────
    ['03/02/2026',  'Venda Soja — Lote 4 (2.000 sc)',          'Soja',                       '',               260000,   'entrada', 'recebido'],
    ['05/02/2026',  'Venda Milho — Lote 2 (2.500 sc)',         'Milho',                      '',                75000,   'entrada', 'recebido'],
    ['07/02/2026',  'Compra Inseticida',                       'Insumos Agrícolas',          'Defensivos',     -31000,   'saída',   'pago'],
    ['10/02/2026',  'Compra Fertilizante KCl',                 'Insumos Agrícolas',          'Fertilizantes',  -84000,   'saída',   'pago'],
    ['12/02/2026',  'Combustível — Diesel s-10 (10.000 L)',    'Operação',                   'Combustível',    -63000,   'saída',   'pago'],
    ['14/02/2026',  'Parcela Sicredi — Custeio 25/26',         'Compromissos Financeiros',   'Financiamentos', -55000,   'saída',   'pago'],
    ['15/02/2026',  'Folha de Pagamento Fev',                  'Operação',                   'Mão de Obra',    -85000,   'saída',   'pago'],
    ['17/02/2026',  'Arrendamento Fev — Gleba Norte',          'Compromissos Financeiros',   'Arrendamentos',  -48000,   'saída',   'pago'],
    ['18/02/2026',  'Venda Milho Safrinha — Lote 2',            'Milho Safrinha',             '',               275000,   'entrada', 'recebido'],
    ['20/02/2026',  'Venda Soja — Lote 5 (1.800 sc)',          'Soja',                       '',               234000,   'entrada', 'recebido'],
    ['22/02/2026',  'Seguro Agrícola — Parcela 2/6',           'Seguros',                    '',               -28000,   'saída',   'pago'],
    ['24/02/2026',  'Manutenção Trator Valtra',                'Operação',                   'Manutenção',     -18500,   'saída',   'pago'],
    ['26/02/2026',  'Conta de Energia — Pivô',                 'Operação',                   'Energia',        -24000,   'saída',   'pago'],
    ['28/02/2026',  'FUNRURAL — Competência Jan/26',           'Impostos e Taxas',           'FUNRURAL',       -18200,   'saída',   'pago'],
    // ── Março ────────────────────────────────────────────────────────────────
    ['02/03/2026',  'Venda Soja — Lote 6 (2.500 sc)',          'Soja',                       '',               325000,   'entrada', 'recebido'],
    ['04/03/2026',  'Venda Milho — Lote 3 (4.000 sc)',         'Milho',                      '',               120000,   'entrada', 'recebido'],
    ['05/03/2026',  'Compra Semente Soja — Safra 26/27',       'Insumos Agrícolas',          'Sementes',      -145000,   'saída',   'pago'],
    ['07/03/2026',  'Compra Fertilizante Ureia',               'Insumos Agrícolas',          'Fertilizantes', -112000,   'saída',   'pago'],
    ['10/03/2026',  'Parcela BB — FCO PUMA 230',               'Compromissos Financeiros',   'Financiamentos', -71583,   'saída',   'pago'],
    ['10/03/2026',  'Arrendamento Mar — Gleba Norte',          'Compromissos Financeiros',   'Arrendamentos',  -48000,   'saída',   'pago'],
    ['12/03/2026',  'Combustível — Diesel s-10 (14.000 L)',    'Operação',                   'Combustível',    -88200,   'saída',   'pago'],
    ['14/03/2026',  'Venda Milho Safrinha — Lote 3',            'Milho Safrinha',             '',               300000,   'entrada', 'recebido'],
    ['15/03/2026',  'Folha de Pagamento Mar',                  'Operação',                   'Mão de Obra',    -88000,   'saída',   'pago'],
    ['16/03/2026',  'Compra Defensivo — Fungicida',            'Insumos Agrícolas',          'Defensivos',     -56000,   'saída',   'pago'],
    ['18/03/2026',  'Venda Soja — Lote 7 (3.000 sc)',          'Soja',                       '',               390000,   'entrada', 'recebido'],
    ['20/03/2026',  'Seguro Agrícola — Parcela 3/6',           'Seguros',                    '',               -28000,   'saída',   'pendente'],
    ['22/03/2026',  'Manutenção Pulverizador',                 'Operação',                   'Manutenção',     -22000,   'saída',   'pago'],
    ['24/03/2026',  'Conta de Energia — Pivô',                 'Operação',                   'Energia',        -26000,   'saída',   'pago'],
    ['25/03/2026',  'FUNRURAL — Competência Fev/26',           'Impostos e Taxas',           'FUNRURAL',       -21000,   'saída',   'pendente'],
    ['28/03/2026',  'Adiantamento Venda Soja — Abr',           'Soja',                       '',               180000,   'entrada', 'recebido'],
    ['30/03/2026',  'Parcela CEF — Financiamento Gleba',       'Compromissos Financeiros',   'Financiamentos',  -92000,   'saída',   'pendente'],
    // ── Abril (projeção) ──────────────────────────────────────────────────────
    ['05/04/2026',  'Compra Semente Milho — Safra 26/27',      'Insumos Agrícolas',          'Sementes',       -95000,   'saída',   'pendente'],
    ['07/04/2026',  'Compra Fertilizante MAP — Abr',           'Insumos Agrícolas',          'Fertilizantes',  -120000,   'saída',   'pendente'],
    ['10/04/2026',  'Parcela BB — FCO PUMA 230',               'Compromissos Financeiros',   'Financiamentos',  -71583,   'saída',   'pendente'],
    ['10/04/2026',  'Arrendamento Abr — Gleba Norte',          'Compromissos Financeiros',   'Arrendamentos',   -48000,   'saída',   'pendente'],
    ['12/04/2026',  'Compra Defensivo — Herbicida Abr',        'Insumos Agrícolas',          'Defensivos',      -65000,   'saída',   'pendente'],
    ['14/04/2026',  'Combustível — Diesel s-10 (13.000 L)',    'Operação',                   'Combustível',     -90000,   'saída',   'pendente'],
    ['15/04/2026',  'Folha de Pagamento Abr',                  'Operação',                   'Mão de Obra',     -88000,   'saída',   'pendente'],
    ['18/04/2026',  'Parcela CEF — Financiamento Gleba',       'Compromissos Financeiros',   'Financiamentos',  -92000,   'saída',   'pendente'],
    ['20/04/2026',  'Conta de Energia — Pivô',                 'Operação',                   'Energia',         -26000,   'saída',   'pendente'],
    ['22/04/2026',  'Seguro Agrícola — Parcela 4/6',           'Seguros',                    '',                -28000,   'saída',   'pendente'],
    ['25/04/2026',  'Manutenção Plantadeira',                  'Operação',                   'Manutenção',      -25000,   'saída',   'pendente'],
    ['28/04/2026',  'FUNRURAL — Competência Mar/26',           'Impostos e Taxas',           'FUNRURAL',        -22000,   'saída',   'pendente'],
    // ── Maio (projeção) ───────────────────────────────────────────────────────
    ['05/05/2026',  'Compra Fertilizante KCl — Mai',           'Insumos Agrícolas',          'Fertilizantes',  -130000,   'saída',   'pendente'],
    ['07/05/2026',  'Compra Defensivo — Inseticida Mai',       'Insumos Agrícolas',          'Defensivos',      -70000,   'saída',   'pendente'],
    ['10/05/2026',  'Parcela BB — FCO PUMA 230',               'Compromissos Financeiros',   'Financiamentos',  -71583,   'saída',   'pendente'],
    ['10/05/2026',  'Arrendamento Mai — Gleba Norte',          'Compromissos Financeiros',   'Arrendamentos',   -48000,   'saída',   'pendente'],
    ['12/05/2026',  'Combustível — Diesel s-10 (14.000 L)',    'Operação',                   'Combustível',     -95000,   'saída',   'pendente'],
    ['15/05/2026',  'Folha de Pagamento Mai',                  'Operação',                   'Mão de Obra',     -88000,   'saída',   'pendente'],
    ['16/05/2026',  'Parcela CEF — Financiamento Gleba',       'Compromissos Financeiros',   'Financiamentos',  -92000,   'saída',   'pendente'],
    ['18/05/2026',  'Compra Defensivo — Fungicida Mai',        'Insumos Agrícolas',          'Defensivos',      -55000,   'saída',   'pendente'],
    ['20/05/2026',  'Conta de Energia — Pivô',                 'Operação',                   'Energia',         -26000,   'saída',   'pendente'],
    ['22/05/2026',  'Seguro Agrícola — Parcela 5/6',           'Seguros',                    '',                -28000,   'saída',   'pendente'],
    ['25/05/2026',  'Manutenção Trator + Implementos',         'Operação',                   'Manutenção',      -20000,   'saída',   'pendente'],
    ['28/05/2026',  'FUNRURAL — Competência Abr/26',           'Impostos e Taxas',           'FUNRURAL',        -22000,   'saída',   'pendente'],
    // ── Maio — Receitas projetadas ────────────────────────────────────────────
    ['08/05/2026',  'Venda Soja — Lote 8 (5.000 sc @ R$138)',  'Soja',                       '',               690000,   'entrada', 'pendente'],
    ['14/05/2026',  'Venda Soja — Lote 9 (3.500 sc @ R$138)',  'Soja',                       '',               483000,   'entrada', 'pendente'],
    ['19/05/2026',  'Venda Milho Verão — Lote 1 (2.000 sc @ R$78)', 'Milho',                '',               156000,   'entrada', 'pendente'],
    ['26/05/2026',  'Adiantamento Milho Safrinha — Contrato 1','Milho Safrinha',             '',               120000,   'entrada', 'pendente'],
    // ── Junho (projeção) ──────────────────────────────────────────────────────
    ['03/06/2026',  'Compra Fertilizante Ureia — Jun',         'Insumos Agrícolas',          'Fertilizantes',   -90000,   'saída',   'pendente'],
    ['05/06/2026',  'Compra Defensivo — Herbicida Jun',        'Insumos Agrícolas',          'Defensivos',      -55000,   'saída',   'pendente'],
    ['10/06/2026',  'Parcela BB — FCO PUMA 230',               'Compromissos Financeiros',   'Financiamentos',  -71583,   'saída',   'pendente'],
    ['10/06/2026',  'Arrendamento Jun — Gleba Norte',          'Compromissos Financeiros',   'Arrendamentos',   -48000,   'saída',   'pendente'],
    ['12/06/2026',  'Combustível — Diesel s-10 (12.000 L)',    'Operação',                   'Combustível',     -85000,   'saída',   'pendente'],
    ['15/06/2026',  'Folha de Pagamento Jun',                  'Operação',                   'Mão de Obra',     -88000,   'saída',   'pendente'],
    ['16/06/2026',  'Parcela CEF — Financiamento Gleba',       'Compromissos Financeiros',   'Financiamentos',  -92000,   'saída',   'pendente'],
    ['18/06/2026',  'Compra Semente Milho Safrinha — 26/27',   'Insumos Agrícolas',          'Sementes',        -65000,   'saída',   'pendente'],
    ['20/06/2026',  'Conta de Energia — Pivô',                 'Operação',                   'Energia',         -24000,   'saída',   'pendente'],
    ['22/06/2026',  'Seguro Agrícola — Parcela 6/6',           'Seguros',                    '',                -28000,   'saída',   'pendente'],
    ['24/06/2026',  'Manutenção Pulverizador',                 'Operação',                   'Manutenção',      -18000,   'saída',   'pendente'],
    ['28/06/2026',  'FUNRURAL — Competência Mai/26',           'Impostos e Taxas',           'FUNRURAL',        -20000,   'saída',   'pendente'],
    // ── Junho — Receitas projetadas ───────────────────────────────────────────
    ['06/06/2026',  'Venda Soja — Lote 10 (4.000 sc @ R$140)', 'Soja',                      '',               560000,   'entrada', 'pendente'],
    ['11/06/2026',  'Venda Soja — Lote 11 (2.500 sc @ R$140)', 'Soja',                      '',               350000,   'entrada', 'pendente'],
    ['17/06/2026',  'Venda Milho Verão — Lote 2 (3.000 sc @ R$78)', 'Milho',                '',               234000,   'entrada', 'pendente'],
    ['23/06/2026',  'Venda Milho Safrinha — Lote 1 (2.500 sc @ R$78)', 'Milho Safrinha',    '',               195000,   'entrada', 'pendente'],
    ['27/06/2026',  'Venda Milho Safrinha — Lote 2 (1.500 sc @ R$78)', 'Milho Safrinha',    '',               117000,   'entrada', 'pendente'],
  ]);
  setCols(wsTransacoes, [14, 42, 26, 18, 12, 10, 12]);
  XLSX.utils.book_append_sheet(wb, wsTransacoes, 'Transações');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Fluxo Agregado" — Lançamento mensal consolidado
  // Para clientes com dados já consolidados (ex: exportação de outro sistema)
  // Colunas: A=categoria B=subcategoria C=tipo D=tipo_lancamento E=ano F=jan … Q=dez
  // ══════════════════════════════════════════════════════════════════════════
  const wsFluxoAgregado = XLSX.utils.aoa_to_sheet([
    ['categoria',                  'subcategoria',    'tipo',    'tipo_lancamento', 'ano',   'jan',    'fev',    'mar',    'abr',    'mai',    'jun',    'jul',    'ago',    'set',    'out',    'nov',    'dez'],
    // ── REALIZADOS Jan–Mar ────────────────────────────────────────────────────
    ['Soja',                       '',                'entrada', 'realizado',       2026,  655000,  494000,  895000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Milho',                      '',                'entrada', 'realizado',       2026,   90000,   75000,  120000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Milho Safrinha',             '',                'entrada', 'realizado',       2026,  200000,  275000,  300000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Insumos Agrícolas',          'Sementes',        'saída',   'realizado',       2026,   60000,       0,  145000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Insumos Agrícolas',          'Defensivos',      'saída',   'realizado',       2026,   42000,   31000,   56000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Insumos Agrícolas',          'Fertilizantes',   'saída',   'realizado',       2026,   98000,   84000,  112000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Operação',                   'Mão de Obra',     'saída',   'realizado',       2026,   85000,   85000,   88000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Operação',                   'Combustível',     'saída',   'realizado',       2026,   75600,   63000,   88200,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Operação',                   'Manutenção',      'saída',   'realizado',       2026,   34000,   18500,   22000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Operação',                   'Energia',         'saída',   'realizado',       2026,   22000,   24000,   26000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Compromissos Financeiros',   'Financiamentos',  'saída',   'realizado',       2026,   71583,   55000,  163583,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Compromissos Financeiros',   'Arrendamentos',   'saída',   'realizado',       2026,   48000,   48000,   48000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Seguros',                    '',                'saída',   'realizado',       2026,   28000,   28000,       0,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    ['Impostos e Taxas',           'FUNRURAL',        'saída',   'realizado',       2026,       0,   18200,   21000,       0,       0,       0,       0,       0,       0,       0,       0,       0],
    // ── ORÇADOS Abr–Dez ──────────────────────────────────────────────────────
    ['Soja',                       '',                'entrada', 'orçado',          2026,       0,       0,       0,  720000,  680000,  630000,  580000,  560000,  540000,  520000,  500000,  480000],
    ['Milho',                      '',                'entrada', 'orçado',          2026,       0,       0,       0,  210000,  200000,  190000,  180000,  175000,  170000,  165000,  160000,  155000],
    ['Milho Safrinha',             '',                'entrada', 'orçado',          2026,       0,       0,       0,  280000,  260000,  240000,       0,       0,       0,       0,       0,       0],
    ['Insumos Agrícolas',          'Sementes',        'saída',   'orçado',          2026,       0,       0,       0,  160000,   40000,       0,       0,   80000,       0,       0,       0,       0],
    ['Insumos Agrícolas',          'Defensivos',      'saída',   'orçado',          2026,       0,       0,       0,   65000,   70000,   55000,   40000,   45000,   35000,   30000,   25000,   20000],
    ['Insumos Agrícolas',          'Fertilizantes',   'saída',   'orçado',          2026,       0,       0,       0,  120000,  130000,   90000,   60000,   80000,   50000,   40000,   30000,   20000],
    ['Operação',                   'Mão de Obra',     'saída',   'orçado',          2026,       0,       0,       0,   88000,   88000,   88000,   88000,   88000,   88000,   88000,   88000,   88000],
    ['Operação',                   'Combustível',     'saída',   'orçado',          2026,       0,       0,       0,   90000,   95000,   85000,   75000,   80000,   72000,   68000,   65000,   60000],
    ['Operação',                   'Manutenção',      'saída',   'orçado',          2026,       0,       0,       0,   25000,   20000,   18000,   15000,   18000,   15000,   12000,   12000,   10000],
    ['Operação',                   'Energia',         'saída',   'orçado',          2026,       0,       0,       0,   26000,   26000,   24000,   22000,   22000,   20000,   20000,   18000,   18000],
    ['Compromissos Financeiros',   'Financiamentos',  'saída',   'orçado',          2026,       0,       0,       0,  163583,  163583,  163583,  163583,  163583,  163583,  163583,  163583,  163583],
    ['Compromissos Financeiros',   'Arrendamentos',   'saída',   'orçado',          2026,       0,       0,       0,   48000,   48000,   48000,   48000,   48000,   48000,   48000,   48000,   48000],
    ['Seguros',                    '',                'saída',   'orçado',          2026,       0,       0,       0,   28000,   28000,   28000,       0,       0,       0,       0,       0,       0],
    ['Impostos e Taxas',           'FUNRURAL',        'saída',   'orçado',          2026,       0,       0,       0,   22000,   22000,   20000,   18000,   18000,   16000,   16000,   14000,   14000],
  ]);
  setCols(wsFluxoAgregado, [26, 18, 10, 16, 6, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]);
  XLSX.utils.book_append_sheet(wb, wsFluxoAgregado, 'Fluxo Agregado');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Ativo" — Balanço Patrimonial
  // Formato: Grupo / Subgrupo / Item / valores por safra
  // Muito mais amigável que o formato anterior com id/level/col_xxx
  // ══════════════════════════════════════════════════════════════════════════
  // Colunas de valor são livres — o exemplo usa 5 colunas, mas o usuário pode ter 2, 3, 10, etc.
  const wsAtivo = XLSX.utils.aoa_to_sheet([
    // cabeçalho — Fazenda é coluna estrutural (não vira coluna de valor)
    ['Grupo',                'Subgrupo',       'Item',                  'Fazenda',           '2022/23',  '2023/24',  '1ª Avaliação', '2ª Avaliação', 'Visão Atual'],
    // ── Fazenda Santa Fé ─────────────────────────────────────────────────────
    ['ATIVO CIRCULANTE',     '',               '',                      'Fazenda Santa Fé',  42500000,   47200000,   52100000,       50800000,       40300000],
    ['ATIVO CIRCULANTE',     'Financeiro',     '',                      'Fazenda Santa Fé',  10200000,   11400000,   12600000,       14500000,       17100000],
    ['ATIVO CIRCULANTE',     'Financeiro',     'Disponível',            'Fazenda Santa Fé',    600000,     680000,     790000,        1800000,        4500000],
    ['ATIVO CIRCULANTE',     'Financeiro',     'Cooperativa',           'Fazenda Santa Fé',   4600000,    5000000,    5400000,        5900000,        2700000],
    ['ATIVO CIRCULANTE',     'Financeiro',     'Créditos a Receber',    'Fazenda Santa Fé',   5000000,    5720000,    6410000,        6800000,        9900000],
    ['ATIVO CIRCULANTE',     'Produtos',       '',                      'Fazenda Santa Fé',  32300000,   35800000,   39500000,       36300000,       23200000],
    ['ATIVO CIRCULANTE',     'Produtos',       'Insumos',               'Fazenda Santa Fé',   2500000,    2700000,    2900000,        3800000,        4800000],
    ['ATIVO CIRCULANTE',     'Produtos',       'Produto para Venda',    'Fazenda Santa Fé',   5000000,    5900000,    6600000,       10800000,       12700000],
    ['ATIVO CIRCULANTE',     'Produtos',       'Adiantamentos',         'Fazenda Santa Fé',  24800000,   27200000,   30000000,       21700000,        5700000],
    ['ATIVO NÃO CIRCULANTE', '',               '',                      'Fazenda Santa Fé', 218000000,  231000000,  238500000,      238500000,      239800000],
    ['ATIVO NÃO CIRCULANTE', 'Terras',         '',                      'Fazenda Santa Fé', 130000000,  137000000,  141000000,      141000000,      141000000],
    ['ATIVO NÃO CIRCULANTE', 'Imobilizado',    '',                      'Fazenda Santa Fé',  36000000,   38000000,   37200000,       37200000,       37200000],
    ['ATIVO NÃO CIRCULANTE', 'Investimentos',  '',                      'Fazenda Santa Fé',  52000000,   56000000,   60300000,       60300000,       61600000],
    // ── Fazenda Boa Vista ────────────────────────────────────────────────────
    ['ATIVO CIRCULANTE',     '',               '',                      'Fazenda Boa Vista',  16480000,   17780000,   18720000,       17700000,       14128694],
    ['ATIVO CIRCULANTE',     'Financeiro',     '',                      'Fazenda Boa Vista',   4350000,    4650000,    4931756,        5600000,        6246976],
    ['ATIVO CIRCULANTE',     'Financeiro',     'Disponível',            'Fazenda Boa Vista',    250000,     270000,     299751,          700000,        1604999],
    ['ATIVO CIRCULANTE',     'Financeiro',     'Cooperativa',           'Fazenda Boa Vista',   1900000,    2100000,    2220823,        2300000,        1063555],
    ['ATIVO CIRCULANTE',     'Financeiro',     'Créditos a Receber',    'Fazenda Boa Vista',   2200000,    2280000,    2411180,        2600000,        3578421],
    ['ATIVO CIRCULANTE',     'Produtos',       '',                      'Fazenda Boa Vista',  12130000,   13130000,   13788681,       12100000,        7881717],
    ['ATIVO CIRCULANTE',     'Produtos',       'Insumos',               'Fazenda Boa Vista',   1000000,    1100000,    1187218,        1400000,        1750399],
    ['ATIVO CIRCULANTE',     'Produtos',       'Produto para Venda',    'Fazenda Boa Vista',   2000000,    2300000,    2459913,        4000000,        4615478],
    ['ATIVO CIRCULANTE',     'Produtos',       'Adiantamentos',         'Fazenda Boa Vista',   9130000,    9730000,   10141550,        6700000,        1515840],
    ['ATIVO NÃO CIRCULANTE', '',               '',                      'Fazenda Boa Vista',  86500000,   89600000,   91682793,       92500000,       92694721],
    ['ATIVO NÃO CIRCULANTE', 'Terras',         '',                      'Fazenda Boa Vista',  50000000,   53000000,   54600000,       54600000,       54600000],
    ['ATIVO NÃO CIRCULANTE', 'Imobilizado',    '',                      'Fazenda Boa Vista',  15000000,   15000000,   14500000,       14500000,       14500000],
    ['ATIVO NÃO CIRCULANTE', 'Investimentos',  '',                      'Fazenda Boa Vista',  21500000,   21600000,   22582793,       23400000,       23594721],
  ]);
  setCols(wsAtivo, [28, 20, 24, 20, 12, 12, 14, 14, 12]);
  XLSX.utils.book_append_sheet(wb, wsAtivo, 'Ativo');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Passivo" — Balanço Patrimonial
  // ══════════════════════════════════════════════════════════════════════════
  const wsPassivo = XLSX.utils.aoa_to_sheet([
    ['Grupo',                  'Subgrupo',           'Item',                  'Fazenda',           '2022/23',  '2023/24',  '1ª Avaliação', '2ª Avaliação', 'Visão Atual'],
    // ── Fazenda Santa Fé ─────────────────────────────────────────────────────
    ['PASSIVO CIRCULANTE',     '',                   '',                      'Fazenda Santa Fé',  59000000,   54200000,   54220000,       50000000,       45000000],
    ['PASSIVO CIRCULANTE',     'Financeiro',         '',                      'Fazenda Santa Fé',  46000000,   41900000,   41920000,       44000000,       42800000],
    ['PASSIVO CIRCULANTE',     'Financeiro',         'Custeio Agrícola',      'Fazenda Santa Fé',  19000000,   19500000,   19500000,       21500000,       23100000],
    ['PASSIVO CIRCULANTE',     'Financeiro',         'Investimento',          'Fazenda Santa Fé',   2300000,    2500000,    2650000,        3200000,        4300000],
    ['PASSIVO CIRCULANTE',     'Financeiro',         'Financiamentos',        'Fazenda Santa Fé',  18000000,   14700000,   14000000,       10800000,        9000000],
    ['PASSIVO CIRCULANTE',     'Operacional',        '',                      'Fazenda Santa Fé',  13000000,   12300000,   12300000,        6500000,        2400000],
    ['PASSIVO CIRCULANTE',     'Operacional',        'Contas a Pagar',        'Fazenda Santa Fé',   5700000,    5500000,    5500000,        2900000,          940000],
    ['PASSIVO CIRCULANTE',     'Operacional',        'Fornecedores',          'Fazenda Santa Fé',   7300000,    6800000,    6800000,        3600000,        1440000],
    ['PASSIVO NÃO CIRCULANTE', '',                   '',                      'Fazenda Santa Fé',  68000000,   64500000,   63000000,       51500000,       42300000],
    ['PASSIVO NÃO CIRCULANTE', 'Financiamentos LP',  '',                      'Fazenda Santa Fé',  68000000,   64500000,   63000000,       51500000,       42300000],
    ['PASSIVO NÃO CIRCULANTE', 'Financiamentos LP',  'Banco da Amazônia',     'Fazenda Santa Fé',  27000000,   25800000,   25000000,       21500000,       21500000],
    ['PASSIVO NÃO CIRCULANTE', 'Financiamentos LP',  'Banco do Brasil',       'Fazenda Santa Fé',  41000000,   38700000,   38000000,       30000000,       20800000],
    ['PATRIMÔNIO LÍQUIDO',     '',                   '',                      'Fazenda Santa Fé', 133500000,  159500000,  173600000,      187800000,      192800000],
    // ── Fazenda Boa Vista ────────────────────────────────────────────────────
    ['PASSIVO CIRCULANTE',     '',                   '',                      'Fazenda Boa Vista',  23000000,   21100000,   21071398,       20000000,       17877495],
    ['PASSIVO CIRCULANTE',     'Financeiro',         '',                      'Fazenda Boa Vista',  18000000,   16300000,   16275062,       17000000,       16774697],
    ['PASSIVO CIRCULANTE',     'Financeiro',         'Custeio Agrícola',      'Fazenda Boa Vista',   8000000,    7500000,    7473538,        8500000,        8994809],
    ['PASSIVO CIRCULANTE',     'Financeiro',         'Investimento',          'Fazenda Boa Vista',    900000,    1000000,    1031066,        1300000,        1682694],
    ['PASSIVO CIRCULANTE',     'Financeiro',         'Financiamentos',        'Fazenda Boa Vista',   7000000,    5800000,    5477714,        4200000,        3571351],
    ['PASSIVO CIRCULANTE',     'Operacional',        '',                      'Fazenda Boa Vista',   5000000,    4800000,    4796336,        2500000,          902798],
    ['PASSIVO CIRCULANTE',     'Operacional',        'Contas a Pagar',        'Fazenda Boa Vista',   2300000,    2100000,    2096336,        1100000,          362798],
    ['PASSIVO CIRCULANTE',     'Operacional',        'Fornecedores',          'Fazenda Boa Vista',   2700000,    2700000,    2700000,        1400000,          560000],
    ['PASSIVO NÃO CIRCULANTE', '',                   '',                      'Fazenda Boa Vista',  27000000,   25500000,   25000000,       20500000,       16833665],
    ['PASSIVO NÃO CIRCULANTE', 'Financiamentos LP',  '',                      'Fazenda Boa Vista',  27000000,   25500000,   25000000,       20500000,       16833665],
    ['PASSIVO NÃO CIRCULANTE', 'Financiamentos LP',  'Banco da Amazônia',     'Fazenda Boa Vista',  11000000,   10200000,   10000000,        8500000,        8500000],
    ['PASSIVO NÃO CIRCULANTE', 'Financiamentos LP',  'Banco do Brasil',       'Fazenda Boa Vista',  16000000,   15300000,   15000000,       12000000,        8333665],
    ['PATRIMÔNIO LÍQUIDO',     '',                   '',                      'Fazenda Boa Vista',  52980000,   60780000,   64111832,       69700000,       72113551],
  ]);
  setCols(wsPassivo, [28, 24, 26, 20, 12, 12, 14, 14, 12]);
  XLSX.utils.book_append_sheet(wb, wsPassivo, 'Passivo');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "DRE" — Demonstrativo de Resultado
  // ══════════════════════════════════════════════════════════════════════════
  // Cabeçalho completo — inclui custoInsumos/Operacao/Juros para habilitar indicadores
  const dreHeader = [
    'safra', 'fazenda', 'atividade',
    'areaTotal', 'producaoTotal', 'produtividadeMedia', 'precoMedioVenda',
    'receitaBruta', 'custoTotal', 'custoInsumos', 'custoOperacao', 'custoJuros',
    'lucroBruto', 'despesasOperacionais', 'ebitda',
    'resultadoLiquido', 'margemBruta', 'margemLiquida', 'pontoEquilibrio', 'roi',
    'orcadoVbp', 'orcadoCusto', 'orcadoResultado',
  ];

  // Dados de 2019/20 a 2024/25 — tendência ascendente com picos e leves variações
  // Formato: safra | fazenda | atividade | area | prod | produtiv | preco |
  //          recBruta | custoTotal | custoInsumos | custoOper | custoJuros |
  //          lucroBruto | despOper | ebitda |
  //          resultLiq | margBruta | margLiq | pontEq | roi |
  //          orcVBP | orcCusto | orcResult
  // Formato: safra | fazenda | atividade | area | prod | produtiv | preco |
  //          recBruta | custoTotal | custoInsumos | custoOper | custoJuros |
  //          lucroBruto | despOper | ebitda |
  //          resultLiq | margBruta | margLiq | pontEq | roi |
  //          orcVBP | orcCusto | orcResult
  const dreRows = [
    // ── 2019/20 — ano base, preço baixo, margens apertadas ───────────────────
    ['2019/20', 'Fazenda Santa Fé', 'Soja',
      1800, 106200, 59.0,  80,
      8496000,  6800000, 3740000, 2040000, 1020000,
      1696000,  780000, 1300000,
       916000,  20.0, 10.8, 52.6, 13.5,
      8800000, 7000000, 1800000],
    ['2019/20', 'Fazenda Santa Fé', 'Milho',
       600,  48000, 80.0,  42,
      2016000,  1400000,  700000,  490000,  210000,
       616000,  100800,  515200,
       515200,  30.6, 25.6, 29.2, 36.8,
      1900000, 1450000,  450000],

    // ── 2020/21 — pico: disparada de preços (COVID + China) ──────────────────
    ['2020/21', 'Fazenda Santa Fé', 'Soja',
      1900, 124700, 65.6, 140,
     17458000,  9100000, 5005000, 2730000, 1365000,
      8358000, 1100000, 7600000,
      7258000,  47.9, 41.6, 38.3, 45.2,
     16000000, 9500000, 6500000],
    ['2020/21', 'Fazenda Santa Fé', 'Milho',
       650,  55250, 85.0,  65,
      3591250,  1900000,  950000,  665000,  285000,
      1691250,  179563, 1511687,
      1511687,  47.1, 42.1, 34.4, 79.6,
      3200000, 1950000, 1250000],

    // ── 2021/22 — preços altos, custos sobem com insumos ─────────────────────
    ['2021/22', 'Fazenda Santa Fé', 'Soja',
      1980, 132660, 67.0, 148,
     19633680, 13200000, 7260000, 3960000, 1980000,
      6433680, 2100000, 5200000,
      4333680,  32.8, 22.1, 52.5, 24.1,
     20000000, 14000000, 6000000],
    ['2021/22', 'Fazenda Santa Fé', 'Milho',
       700,  61600, 88.0,  72,
      4435200,  2700000, 1350000,  945000,  405000,
      1735200,  221760, 1513440,
      1513440,  39.1, 34.1, 43.8, 56.1,
      4000000, 2750000, 1250000],

    // ── 2022/23 — leve retração: preços caem, custos permanecem altos ────────
    ['2022/23', 'Fazenda Santa Fé', 'Soja',
      2050, 136325, 66.5, 133,
     18139225, 13800000, 7590000, 4140000, 2070000,
      4339225, 1800000, 3500000,
      2539225,  23.9, 14.0, 57.2, 18.4,
     19500000, 14500000, 5000000],
    ['2022/23', 'Fazenda Santa Fé', 'Milho',
       750,  67500, 90.0,  68,
      4590000,  3100000, 1550000, 1085000,  465000,
      1490000,  229500, 1260500,
      1260500,  32.5, 27.5, 45.9, 40.7,
      4300000, 3200000, 1100000],

    // ── 2023/24 — recuperação: produtividade cresce, margem melhora ──────────
    ['2023/24', 'Fazenda Santa Fé', 'Soja',
      2200, 149600, 68.0, 132,
     19747200, 14300000, 7865000, 4290000, 2145000,
      5447200, 2000000, 4600000,
      3447200,  27.6, 17.5, 52.9, 24.1,
     20000000, 15000000, 5000000],
    ['2023/24', 'Fazenda Santa Fé', 'Milho',
       800,  73600, 92.0,  65,
      4784000,  3300000, 1650000, 1155000,  495000,
      1484000,  239200, 1244800,
      1244800,  31.0, 26.0, 44.8, 37.7,
      4500000, 3400000, 1100000],

    // ── 2024/25 — crescimento sustentado: maior área e eficiência ────────────
    ['2024/25', 'Fazenda Santa Fé', 'Soja',
      2350, 161650, 68.8, 128,
     20691200, 15050000, 8277500, 4515000, 2257500,
      5641200, 2200000, 4800000,
      3441200,  27.3, 16.6, 57.0, 22.9,
     21500000, 15800000, 5700000],
    ['2024/25', 'Fazenda Santa Fé', 'Milho',
       850,  80750, 95.0,  62,
      5006500,  3500000, 1750000, 1225000,  525000,
      1506500,  250325, 1256175,
      1256175,  30.1, 25.1, 43.3, 35.9,
      4800000, 3600000, 1200000],
  ];

  const wsDRE = XLSX.utils.aoa_to_sheet([dreHeader, ...dreRows]);
  setCols(wsDRE, [10,18,12, 10,13,13,14, 13,12,13,13,12, 12,20,12, 12,11,10,10,8, 12,12,13]);
  XLSX.utils.book_append_sheet(wb, wsDRE, 'DRE');

  // ── Culturas (opcional) ──────────────────────────────────────────────────
  // Detalhamento por cultura para cada safra — reflete os agregados da aba DRE
  const wsCulturas = XLSX.utils.aoa_to_sheet([
    ['safra',   'nome',  'area', 'producao', 'produtividade', 'precoMedio',
     'receitaBruta', 'custoTotal', 'margemLiquida', 'variacaoMargem'],
    // 2019/20 — base: apenas soja, margens apertadas
    ['2019/20', 'Soja',  1260,  74340, 59.0,  80,  5947200,  4760000, 19.9,  0.0],
    ['2019/20', 'Milho',  540,  31860, 59.0,  80,  2548800,  2040000, 19.9,  0.0],
    // 2020/21 — pico de preço (COVID + China)
    ['2020/21', 'Soja',  1330,  87290, 65.6, 140, 12220600,  6370000, 47.9, 28.0],
    ['2020/21', 'Milho',  570,  37410, 65.6, 140,  5237400,  2730000, 47.9, 28.0],
    // 2021/22 — preços altos, custos sobem
    ['2021/22', 'Soja',  1386,  92862, 67.0, 148, 13743576,  9240000, 32.8, -15.1],
    ['2021/22', 'Milho',  594,  39798, 67.0, 148,  5890104,  3960000, 32.8, -15.1],
    // 2022/23 — leve retração: preço cai, custos permanecem altos
    ['2022/23', 'Soja',  1435,  95428, 66.5, 133, 12691924,  9660000, 23.9,  -8.9],
    ['2022/23', 'Milho',  615,  40898, 66.5, 133,  5439434,  4140000, 23.9,  -8.9],
    // 2023/24 — recuperação: produtividade cresce, margem melhora
    ['2023/24', 'Soja',  1540, 105336, 68.4, 132, 13904352,  9800000, 29.5,   0.0],
    ['2023/24', 'Milho',  660,  44264, 67.1, 132,  5842848,  4500000, 23.0,   1.5],
    // 2024/25 — crescimento sustentado: maior área e eficiência
    ['2024/25', 'Soja',  1650, 116820, 70.8, 128, 14952960, 10500000, 29.8,   2.1],
    ['2024/25', 'Milho',  700,  44030, 62.9, 128,  5638240,  4550000, 19.3,  -1.2],
  ]);
  setCols(wsCulturas, [10,12,8,10,14,12,13,11,14,14]);
  XLSX.utils.book_append_sheet(wb, wsCulturas, 'Culturas');

  // ══════════════════════════════════════════════════════════════════════════
  // ABA "Estoque" — Posição atual por cultura (sem CSS, sem campos técnicos)
  // ══════════════════════════════════════════════════════════════════════════
  const wsEstoque = XLSX.utils.aoa_to_sheet([
    ['Cultura',         'Estoque Inicial (sacas)', 'Estoque Vendido (sacas)'],
    ['Soja',             120000,  68000],
    ['Milho',             92000,  31000],
    ['Milho Safrinha',    48000,   4000],
    ['Feijão',            18000,   8000],
    ['Trigo',             35000,  12000],
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
