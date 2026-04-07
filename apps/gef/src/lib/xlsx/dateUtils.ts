const MONTH_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function serialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

/**
 * Converts an Excel date serial, DD/MM/AAAA string, or ISO string to ISO YYYY-MM-DD.
 */
export function excelDateToIso(value: unknown): string {
  if (typeof value === 'string') {
    // DD/MM/AAAA → YYYY-MM-DD
    const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`;
    return value;
  }
  if (typeof value === 'number') {
    const d = serialToDate(value);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(value ?? '');
}

/**
 * Converts an Excel date serial, DD/MM/AAAA string, or Mes-AA string to "Mes-AA" format.
 * E.g.: 45474 → "Jan-26", "15/01/2026" → "Jan-26", "Jan-26" → "Jan-26"
 */
export function excelDateToMesAno(value: unknown): string {
  if (typeof value === 'number' && value > 10000) {
    const d = serialToDate(value);
    return `${MONTH_ABBR[d.getUTCMonth()]}-${String(d.getUTCFullYear()).slice(2)}`;
  }
  if (typeof value === 'string') {
    // DD/MM/AAAA
    const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (br) {
      const m = parseInt(br[2], 10) - 1;
      return `${MONTH_ABBR[m]}-${br[3].slice(2)}`;
    }
    // MM/AAAA
    const mmyyyy = value.match(/^(\d{1,2})\/(\d{4})$/);
    if (mmyyyy) {
      const m = parseInt(mmyyyy[1], 10) - 1;
      return `${MONTH_ABBR[m]}-${mmyyyy[2].slice(2)}`;
    }
    return value; // já no formato correto ou texto livre
  }
  return String(value ?? '');
}
