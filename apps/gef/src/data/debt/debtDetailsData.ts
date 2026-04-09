export const tipoFinanciamentoData = [
  { name: 'Investimento', value: 35200000, percent: 53.7, color: '#3b82f6' },
  { name: 'Custeio',      value: 30300000, percent: 46.3, color: '#f4af2d' },
];

export const descricaoData = [
  { name: 'Abc - Basa',                       value: 11200000, percent: 17.1 },
  { name: 'Fno Amazonia Rural',               value: 11100000, percent: 17.0 },
  { name: 'Contrato De Financiamento',        value: 10500000, percent: 16.0 },
  { name: 'Cedula De Credito',                value:  7800000, percent: 11.8 },
  { name: 'Colheitadeira 8250, Plantadeira',  value:  4600000, percent:  7.0 },
  { name: 'Plantadeira Hosch Maestro',        value:  4200000, percent:  6.5 },
  { name: 'Finame - Pulverizador',            value:  3000000, percent:  4.5 },
  { name: 'Abc - Investimento Agrícola',      value:  2000000, percent:  3.1 },
  { name: 'Finame - Accura',                  value:  1800000, percent:  2.7 },
  { name: '4002296X - Investimento',          value:  1700000, percent:  2.6 },
];

export const bancoData = [
  { name: 'Banco Da Amazônia',       value: 38400000, percent: 58.7 },
  { name: 'Banco Do Brasil',         value: 17600000, percent: 26.8 },
  { name: 'Caixa Econômica Federal', value:  4600000, percent:  7.0 },
  { name: 'Rabobank',                value:  4500000, percent:  6.8 },
  { name: 'Banco Bradesco',          value:   232300, percent:  0.4 },
  { name: 'John Deere',              value:   203200, percent:  0.3 },
];

export interface ParcelaRow {
  mesAno: string;
  banco: string;
  contrato: string;
  tipo: string;
  descricao: string;
  principal: number;
  juros: number;
  total: number;
  taxa: number;
}

export const parcelasData: ParcelaRow[] = [
  { mesAno: 'Ago-25', banco: 'Banco Do Brasil',   contrato: '506701630',   tipo: 'Investimento', descricao: '506701630 - Plantadeira Horsch',   principal:  240429, juros:  98436, total:  338865, taxa: 29.05 },
  { mesAno: 'Ago-25', banco: 'Banco Do Brasil',   contrato: '506702930',   tipo: 'Investimento', descricao: 'Finame - Accura',                   principal:  206429, juros: 157103, total:  363531, taxa: 43.22 },
  { mesAno: 'Ago-25', banco: 'Banco Bradesco',    contrato: '4004439572',  tipo: 'Investimento', descricao: '4004439572 - Escavadeira',           principal:   60800, juros:  14900, total:   75700, taxa: 19.68 },
  { mesAno: 'Set-25', banco: 'Banco Do Brasil',   contrato: '40023036',    tipo: 'Investimento', descricao: 'Finame Trator Case Puma 230',        principal:  108571, juros:  48230, total:  156801, taxa: 30.76 },
  { mesAno: 'Out-25', banco: 'Banco Do Brasil',   contrato: '40/03272-8',  tipo: 'Custeio',      descricao: 'Cedula De Credito',                  principal: 6500000, juros: 175125, total: 6675125, taxa:  2.62 },
  { mesAno: 'Out-25', banco: 'Banco Do Brasil',   contrato: '40019004',    tipo: 'Investimento', descricao: '40019004 - Col Case - Plat Milho',   principal:  277950, juros: 143101, total:  421051, taxa: 33.99 },
  { mesAno: 'Nov-25', banco: 'Rabobank',          contrato: '88392011',    tipo: 'Investimento', descricao: 'Armazém Grãos 50k',                  principal: 1250000, juros: 320500, total: 1570500, taxa: 25.64 },
  { mesAno: 'Nov-25', banco: 'Caixa Econômica',   contrato: '11092833',    tipo: 'Custeio',      descricao: 'Insumos Safra 25/26',                principal: 3200000, juros: 180000, total: 3380000, taxa:  5.62 },
  { mesAno: 'Dez-25', banco: 'Banco Da Amazônia', contrato: '9928374',     tipo: 'Investimento', descricao: 'Fno Amazonia Rural',                 principal:  850000, juros: 110500, total:  960500, taxa: 13.00 },
  { mesAno: 'Jan-26', banco: 'John Deere',         contrato: 'JD-99283',   tipo: 'Investimento', descricao: 'Colheitadeira S700',                 principal:  450000, juros:  85000, total:  535000, taxa: 18.88 },
  { mesAno: 'Fev-26', banco: 'Banco Do Brasil',   contrato: '506701631',   tipo: 'Investimento', descricao: 'Trator John Deere 8R',               principal:  380000, juros: 145000, total:  525000, taxa: 38.15 },
  { mesAno: 'Mar-26', banco: 'Banco Bradesco',    contrato: '4004439580',  tipo: 'Custeio',      descricao: 'Sementes e Defensivos',              principal: 1800000, juros: 120000, total: 1920000, taxa:  6.66 },
  { mesAno: 'Abr-26', banco: 'Rabobank',          contrato: '88392015',    tipo: 'Investimento', descricao: 'Pivô Central Irrigação',             principal:  950000, juros: 210000, total: 1160000, taxa: 22.10 },
  { mesAno: 'Mai-26', banco: 'Banco Da Amazônia', contrato: '9928380',     tipo: 'Investimento', descricao: 'Abc - Basa',                         principal: 1100000, juros: 165000, total: 1265000, taxa: 15.00 },
];

export const totaisParcelas = {
  principal: 54279552,
  juros: 11190596,
  total: 65470148,
  taxa: 17.09,
};
