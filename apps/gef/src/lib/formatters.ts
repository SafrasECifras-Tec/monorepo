export type CurrencyMode = 'BRL' | 'USD' | 'SOJA';

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const formatCurrency = (value: number, currencyMode: CurrencyMode = 'BRL'): string => {
  const normalizedValue = value === 0 ? 0 : value;
  if (currencyMode === 'SOJA') {
    return `${(normalizedValue / 120).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`;
  }
  if (currencyMode === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(normalizedValue);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normalizedValue);
};

export const formatCompactCurrency = (value: number, currencyMode: CurrencyMode = 'BRL'): string => {
  const normalizedValue = value === 0 ? 0 : value;
  if (currencyMode === 'SOJA') {
    return `${Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(normalizedValue / 120)} sc`;
  }
  return new Intl.NumberFormat(currencyMode === 'USD' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: currencyMode,
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(normalizedValue);
};

export const formatSacas = (n: number): string => `${n.toLocaleString('pt-BR')} scs`;
