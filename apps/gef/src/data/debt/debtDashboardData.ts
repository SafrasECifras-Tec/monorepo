export const SOJA_PRICE = 120;

export const DEBT_TYPES = ['Consórcios', 'Custeio', 'Empréstimos', 'Fazenda', 'Investimento'] as const;

export const TYPE_WEIGHTS: Record<string, number> = {
  'Consórcios': 0.15,
  'Custeio': 0.35,
  'Empréstimos': 0.25,
  'Fazenda': 0.15,
  'Investimento': 0.10,
};

export const debtByTermData = [
  { name: 'Curto Prazo (Safra 2025/26)', value: 37526009.51, percent: 32.5, color: '#3b82f6' },
  { name: 'Longo Prazo (Outras Safras)', value: 77827589.33, percent: 67.5, color: '#8b5cf6' },
];

export const debtByTermAnoData = [
  { name: 'Curto Prazo (Ano 2025)', value: 37526009.51, percent: 32.5, color: '#3b82f6' },
  { name: 'Longo Prazo (Outros Anos)', value: 77827589.33, percent: 67.5, color: '#8b5cf6' },
];

export interface SafraDetalhe {
  tipo: string;
  endividamento: number;
  principal: number;
  juros: number;
  taxa: number;
}

export interface IndicatorRow {
  safra: string;
  endividamento: number;
  principal: number;
  juros: number;
  taxa: number;
}

export const safraDetalhesData: Record<string, SafraDetalhe[]> = {
  '2025/26': [
    { tipo: 'Custeio',      endividamento: 8599878, principal: 7680816, juros:  919062, taxa: 10.67 },
    { tipo: 'Empréstimos',  endividamento: 6142770, principal: 5486297, juros:  656473, taxa: 11.98 },
    { tipo: 'Fazenda',      endividamento: 3685662, principal: 3291778, juros:  393884, taxa:  8.43 },
    { tipo: 'Consórcios',   endividamento: 3685662, principal: 3291778, juros:  393884, taxa:  9.12 },
    { tipo: 'Investimento', endividamento: 2457108, principal: 2194519, juros:  262589, taxa: 11.96 },
  ],
  '2026/27': [
    { tipo: 'Custeio',      endividamento: 2283632, principal: 1834582, juros:  449050, taxa: 19.57 },
    { tipo: 'Empréstimos',  endividamento: 1631166, principal: 1310416, juros:  320750, taxa: 24.47 },
    { tipo: 'Fazenda',      endividamento:  978699, principal:  786249, juros:  192450, taxa: 24.46 },
    { tipo: 'Consórcios',   endividamento:  978699, principal:  786249, juros:  192450, taxa: 19.68 },
    { tipo: 'Investimento', endividamento:  652466, principal:  524166, juros:  128300, taxa: 24.47 },
  ],
  '2027/28': [
    { tipo: 'Custeio',      endividamento: 2644057, principal: 2139981, juros:  504077, taxa: 18.95 },
    { tipo: 'Empréstimos',  endividamento: 1888612, principal: 1528558, juros:  360055, taxa: 23.55 },
    { tipo: 'Fazenda',      endividamento: 1133167, principal:  917135, juros:  216033, taxa: 23.56 },
    { tipo: 'Consórcios',   endividamento: 1133167, principal:  917135, juros:  216033, taxa: 19.07 },
    { tipo: 'Investimento', endividamento:  755445, principal:  611423, juros:  144022, taxa: 23.55 },
  ],
  '2028/29': [
    { tipo: 'Custeio',      endividamento: 2336918, principal: 1831585, juros:  505334, taxa: 21.62 },
    { tipo: 'Empréstimos',  endividamento: 1669227, principal: 1308275, juros:  360953, taxa: 27.60 },
    { tipo: 'Fazenda',      endividamento: 1001536, principal:  784965, juros:  216572, taxa: 27.59 },
    { tipo: 'Consórcios',   endividamento: 1001536, principal:  784965, juros:  216572, taxa: 22.62 },
    { tipo: 'Investimento', endividamento:  667691, principal:  523310, juros:  144381, taxa: 27.60 },
  ],
  '2029/30': [
    { tipo: 'Custeio',      endividamento: 1705021, principal: 1375181, juros:  329840, taxa: 19.35 },
    { tipo: 'Empréstimos',  endividamento: 1217872, principal:  982272, juros:  235600, taxa: 23.99 },
    { tipo: 'Fazenda',      endividamento:  730723, principal:  589363, juros:  141360, taxa: 23.99 },
    { tipo: 'Consórcios',   endividamento:  730723, principal:  589363, juros:  141360, taxa: 19.35 },
    { tipo: 'Investimento', endividamento:  487149, principal:  392909, juros:   94240, taxa: 23.99 },
  ],
  '2030/31': [
    { tipo: 'Custeio',      endividamento: 1137500, principal:  980000, juros:  157500, taxa: 16.07 },
    { tipo: 'Empréstimos',  endividamento:  812500, principal:  700000, juros:  112500, taxa: 16.07 },
    { tipo: 'Fazenda',      endividamento:  487500, principal:  420000, juros:   67500, taxa: 16.07 },
    { tipo: 'Consórcios',   endividamento:  487500, principal:  420000, juros:   67500, taxa: 16.07 },
    { tipo: 'Investimento', endividamento:  325000, principal:  280000, juros:   45000, taxa: 16.07 },
  ],
  '2031/32': [
    { tipo: 'Custeio',      endividamento:  735000, principal:  665000, juros:   70000, taxa: 10.52 },
    { tipo: 'Empréstimos',  endividamento:  525000, principal:  475000, juros:   50000, taxa: 10.52 },
    { tipo: 'Fazenda',      endividamento:  315000, principal:  285000, juros:   30000, taxa: 10.52 },
    { tipo: 'Consórcios',   endividamento:  315000, principal:  285000, juros:   30000, taxa: 10.52 },
    { tipo: 'Investimento', endividamento:  210000, principal:  190000, juros:   20000, taxa: 10.52 },
  ],
  '2032/33': [
    { tipo: 'Custeio',      endividamento:  525000, principal:  490000, juros:   35000, taxa:  7.14 },
    { tipo: 'Empréstimos',  endividamento:  375000, principal:  350000, juros:   25000, taxa:  7.14 },
    { tipo: 'Fazenda',      endividamento:  225000, principal:  210000, juros:   15000, taxa:  7.14 },
    { tipo: 'Consórcios',   endividamento:  225000, principal:  210000, juros:   15000, taxa:  7.14 },
    { tipo: 'Investimento', endividamento:  150000, principal:  140000, juros:   10000, taxa:  7.14 },
  ],
};

export const indicatorsData: IndicatorRow[] = [
  { safra: '2025/26', endividamento: 24571079, principal: 21945188, juros: 2625892, taxa: 10.69 },
  { safra: '2026/27', endividamento:  6524663, principal:  5241664, juros: 1282999, taxa: 19.66 },
  { safra: '2027/28', endividamento:  7554449, principal:  6114230, juros: 1440219, taxa: 19.06 },
  { safra: '2028/29', endividamento:  6676909, principal:  5233099, juros: 1443810, taxa: 21.62 },
  { safra: '2029/30', endividamento:  4871487, principal:  3929086, juros:  942401, taxa: 19.35 },
  { safra: '2030/31', endividamento:  3250000, principal:  2800000, juros:  450000, taxa: 16.07 },
  { safra: '2031/32', endividamento:  2100000, principal:  1900000, juros:  200000, taxa: 10.52 },
  { safra: '2032/33', endividamento:  1500000, principal:  1400000, juros:  100000, taxa:  7.14 },
];

export const indicatorsAnoData: IndicatorRow[] = [
  { safra: '2025', endividamento: 18500000, principal: 16500000, juros: 2000000, taxa: 12.12 },
  { safra: '2026', endividamento: 12595742, principal: 10595742, juros: 2000000, taxa: 18.87 },
  { safra: '2027', endividamento:  7039556, principal:  5599337, juros: 1440219, taxa: 20.45 },
  { safra: '2028', endividamento:  7115679, principal:  5671869, juros: 1443810, taxa: 20.29 },
  { safra: '2029', endividamento:  5774198, principal:  4831797, juros:  942401, taxa: 16.32 },
  { safra: '2030', endividamento:  4060743, principal:  3610743, juros:  450000, taxa: 11.08 },
  { safra: '2031', endividamento:  2675000, principal:  2475000, juros:  200000, taxa:  7.47 },
  { safra: '2032', endividamento:  1800000, principal:  1700000, juros:  100000, taxa:  5.55 },
];
