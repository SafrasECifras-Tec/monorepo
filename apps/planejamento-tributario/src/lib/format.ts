// Shim — re-exports from @socios/utils
// PLT uses 2-decimal BRL (formatCurrencyExact), aliased as formatCurrency for backward compat.
export {
  formatCurrencyExact as formatCurrency,
  formatPercent,
  formatNumber,
} from "@socios/utils";
