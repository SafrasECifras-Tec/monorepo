export type CurrencyMode = "BRL" | "USD" | "SOJA";

export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

/**
 * Multi-currency formatter (0 decimal places for BRL/USD, sacas for SOJA).
 * Default: BRL.
 * Usado pelo GEF e novos apps.
 */
export const formatCurrency = (value: number, currencyMode: CurrencyMode = "BRL"): string => {
  const v = value === 0 ? 0 : value;
  if (currencyMode === "SOJA") {
    return `${(v / 120).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} sc`;
  }
  if (currencyMode === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
};

/**
 * BRL com exatamente 2 casas decimais.
 * Usado pelo PLT (cálculos tributários exigem centavos).
 */
export const formatCurrencyExact = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

export const formatCompactCurrency = (value: number, currencyMode: CurrencyMode = "BRL"): string => {
  const v = value === 0 ? 0 : value;
  if (currencyMode === "SOJA") {
    return `${Intl.NumberFormat("pt-BR", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(v / 120)} sc`;
  }
  return new Intl.NumberFormat(currencyMode === "USD" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: currencyMode,
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(v);
};

export const formatSacas = (n: number): string =>
  `${n.toLocaleString("pt-BR")} scs`;

export const formatPercent = (value: number): string =>
  `${value.toFixed(1)}%`;

export const formatNumber = (value: number): string =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
