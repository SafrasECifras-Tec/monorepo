export const SAFRAS = ['2021/22', '2022/23', '2023/24', '2024/25'] as const;
export type Safra = typeof SAFRAS[number];

export const FAZENDAS = ['Todas', 'Fazenda Santa Fé', 'Fazenda Boa Vista', 'Fazenda São João'] as const;
export type Fazenda = typeof FAZENDAS[number];

export interface CulturaData {
  nome: string;
  emoji: string;
  area: number;         // ha
  producao: number;     // sacas
  produtividade: number; // sc/ha
  precoMedio: number;   // R$/sc
  receitaBruta: number; // R$
  custoTotal: number;   // R$
  margemLiquida: number; // %
  variacaoMargem: number; // pp vs safra anterior
}

export interface SafraData {
  safra: Safra;
  areaTotal: number;
  producaoTotal: number;
  produtividadeMedia: number;
  precoMedioVenda: number;
  receitaBruta: number;
  custoTotal: number;
  lucroBruto: number;
  despesasOperacionais: number;
  ebitda: number;
  resultadoLiquido: number;
  margemBruta: number;
  margemLiquida: number;
  pontoEquilibrio: number;   // sc/ha
  roi: number;               // %
  orcadoVbp: number;         // R$
  orcadoCusto: number;       // R$
  orcadoResultado: number;   // R$
  culturas: CulturaData[];
}

export const dreData: Record<Safra, SafraData> = {
  '2021/22': {
    safra: '2021/22',
    areaTotal: 1980,
    producaoTotal: 132660,
    produtividadeMedia: 66.99,
    precoMedioVenda: 148,
    receitaBruta: 19633680,
    custoTotal: 13200000,
    lucroBruto: 6433680,
    despesasOperacionais: 2100000,
    ebitda: 5200000,
    resultadoLiquido: 4333680,
    margemBruta: 32.8,
    margemLiquida: 22.1,
    pontoEquilibrio: 45.1, roi: 32.8,
    orcadoVbp: 18500000, orcadoCusto: 13800000, orcadoResultado: 4700000,
    culturas: [
      {
        nome: 'Soja', emoji: '🌱',
        area: 1400, producao: 98000, produtividade: 70,
        precoMedio: 148, receitaBruta: 14504000,
        custoTotal: 9380000, margemLiquida: 35.3, variacaoMargem: 0,
      },
      {
        nome: 'Milho', emoji: '🌽',
        area: 580, producao: 34660, produtividade: 59.8,
        precoMedio: 148, receitaBruta: 5129680,
        custoTotal: 3820000, margemLiquida: 25.5, variacaoMargem: 0,
      },
    ],
  },
  '2022/23': {
    safra: '2022/23',
    areaTotal: 2150,
    producaoTotal: 148350,
    produtividadeMedia: 68.99,
    precoMedioVenda: 135,
    receitaBruta: 20027250,
    custoTotal: 14100000,
    lucroBruto: 5927250,
    despesasOperacionais: 2300000,
    ebitda: 4800000,
    resultadoLiquido: 3627250,
    margemBruta: 29.6,
    margemLiquida: 18.1,
    pontoEquilibrio: 48.6, roi: 25.7,
    orcadoVbp: 19500000, orcadoCusto: 14700000, orcadoResultado: 4800000,
    culturas: [
      {
        nome: 'Soja', emoji: '🌱',
        area: 1500, producao: 105000, produtividade: 70,
        precoMedio: 135, receitaBruta: 14175000,
        custoTotal: 9900000, margemLiquida: 30.2, variacaoMargem: -5.1,
      },
      {
        nome: 'Milho', emoji: '🌽',
        area: 650, producao: 43350, produtividade: 66.7,
        precoMedio: 135, receitaBruta: 5852250,
        custoTotal: 4200000, margemLiquida: 28.2, variacaoMargem: 2.7,
      },
    ],
  },
  '2023/24': {
    safra: '2023/24',
    areaTotal: 2320,
    producaoTotal: 162400,
    produtividadeMedia: 70.0,
    precoMedioVenda: 122,
    receitaBruta: 19812800,
    custoTotal: 14900000,
    lucroBruto: 4912800,
    despesasOperacionais: 2450000,
    ebitda: 3800000,
    resultadoLiquido: 2462800,
    margemBruta: 24.8,
    margemLiquida: 12.4,
    pontoEquilibrio: 52.6, roi: 16.5,
    orcadoVbp: 20500000, orcadoCusto: 15500000, orcadoResultado: 5000000,
    culturas: [
      {
        nome: 'Soja', emoji: '🌱',
        area: 1650, producao: 118800, produtividade: 72,
        precoMedio: 122, receitaBruta: 14493600,
        custoTotal: 11000000, margemLiquida: 24.1, variacaoMargem: -6.1,
      },
      {
        nome: 'Milho', emoji: '🌽',
        area: 670, producao: 43600, produtividade: 65.1,
        precoMedio: 122, receitaBruta: 5319200,
        custoTotal: 3900000, margemLiquida: 26.7, variacaoMargem: -1.5,
      },
    ],
  },
  '2024/25': {
    safra: '2024/25',
    areaTotal: 2450,
    producaoTotal: 180750,
    produtividadeMedia: 73.78,
    precoMedioVenda: 131,
    receitaBruta: 23678250,
    custoTotal: 15900000,
    lucroBruto: 7778250,
    despesasOperacionais: 2650000,
    ebitda: 6400000,
    resultadoLiquido: 5128250,
    margemBruta: 32.8,
    margemLiquida: 21.7,
    pontoEquilibrio: 49.5, roi: 32.3,
    orcadoVbp: 22000000, orcadoCusto: 16500000, orcadoResultado: 5500000,
    culturas: [
      {
        nome: 'Soja', emoji: '🌱',
        area: 1750, producao: 129500, produtividade: 74,
        precoMedio: 131, receitaBruta: 16964500,
        custoTotal: 11200000, margemLiquida: 34.0, variacaoMargem: 9.9,
      },
      {
        nome: 'Milho', emoji: '🌽',
        area: 700, producao: 51250, produtividade: 73.2,
        precoMedio: 131, receitaBruta: 6713750,
        custoTotal: 4700000, margemLiquida: 30.0, variacaoMargem: 3.3,
      },
    ],
  },
};

export const historicoPorSafra = SAFRAS.map(s => ({
  safra: s,
  receitaBruta: dreData[s].receitaBruta,
  custoTotal: dreData[s].custoTotal,
  resultadoLiquido: dreData[s].resultadoLiquido,
  margemLiquida: dreData[s].margemLiquida,
  ebitda: dreData[s].ebitda,
  producaoTotal: dreData[s].producaoTotal,
}));

export interface AlertaConsultor {
  id: string;
  tipo: 'alerta' | 'oportunidade' | 'info';
  titulo: string;
  descricao: string;
  safra: Safra;
}

export const alertasData: AlertaConsultor[] = [
  {
    id: '1', tipo: 'oportunidade', safra: '2024/25',
    titulo: 'Melhor produtividade dos últimos 4 anos',
    descricao: 'A Soja atingiu 74 sc/ha na safra 24/25, superando a média histórica de 69,7 sc/ha em +6,2%.',
  },
  {
    id: '2', tipo: 'alerta', safra: '2024/25',
    titulo: 'Custo total cresceu 6,7% vs 23/24',
    descricao: 'O custo operacional subiu de R$ 14,9M para R$ 15,9M. Defensivos e fertilizantes respondem por 68% do aumento.',
  },
  {
    id: '3', tipo: 'oportunidade', safra: '2024/25',
    titulo: 'Margem líquida em recuperação',
    descricao: 'Após queda para 12,4% em 23/24, a margem líquida retornou a 21,7% — patamar próximo ao de 21/22.',
  },
  {
    id: '4', tipo: 'info', safra: '2024/25',
    titulo: 'Área cultivada expandiu 5,6%',
    descricao: 'A área total passou de 2.320 ha para 2.450 ha, com crescimento concentrado na Soja (+100 ha).',
  },
];
