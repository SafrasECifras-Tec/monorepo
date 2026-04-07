export interface EbitdaRow {
  year: string;
  investimentos: number;
  aquisicoes: number;
  consorcios: number;
  juros: number;
  total: number;
}

export const ebitdaData: EbitdaRow[] = [
  { year: '2025/26', investimentos: 53, aquisicoes: 0, consorcios: 0, juros: 30, total: 83.05 },
  { year: '2026/27', investimentos: 48, aquisicoes: 0, consorcios: 0, juros: 15, total: 62.57 },
  { year: '2027/28', investimentos: 53, aquisicoes: 0, consorcios: 0, juros: 16, total: 69.27 },
  { year: '2028/29', investimentos: 43, aquisicoes: 0, consorcios: 0, juros: 16, total: 59.33 },
  { year: '2029/30', investimentos: 28, aquisicoes: 0, consorcios: 0, juros: 11, total: 38.88 },
  { year: '2030/31', investimentos: 28, aquisicoes: 0, consorcios: 0, juros: 11, total: 39.60 },
  { year: '2031/32', investimentos: 21, aquisicoes: 0, consorcios: 0, juros: 12, total: 33.48 },
  { year: '2032/33', investimentos: 21, aquisicoes: 0, consorcios: 0, juros: 13, total: 34.92 },
  { year: '2033/34', investimentos: 14, aquisicoes: 0, consorcios: 0, juros:  2, total: 16.08 },
];

export interface CustoFinanceiroRow {
  year: string;
  value: number;
}

export const custoFinanceiroData: CustoFinanceiroRow[] = [
  { year: '2025/26', value: 9 },
  { year: '2026/27', value: 5 },
  { year: '2027/28', value: 5 },
  { year: '2028/29', value: 5 },
  { year: '2029/30', value: 3 },
  { year: '2030/31', value: 4 },
  { year: '2031/32', value: 4 },
  { year: '2032/33', value: 4 },
  { year: '2033/34', value: 1 },
];

export const custoFinanceiroEbitdaData: CustoFinanceiroRow[] = [
  { year: '2025/26', value: 15 },
  { year: '2026/27', value:  8 },
  { year: '2027/28', value:  9 },
  { year: '2028/29', value:  8 },
  { year: '2029/30', value:  6 },
  { year: '2030/31', value:  7 },
  { year: '2031/32', value:  6 },
  { year: '2032/33', value:  7 },
  { year: '2033/34', value:  2 },
];
