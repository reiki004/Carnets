import * as XLSX from 'xlsx';

/**
 * Normaliza cualquier entrada de fecha (objeto Date de JS, número de serie de Excel,
 * string ISO 'YYYY-MM-DD', string local 'DD/MM/AAAA', o string Date textual como
 * 'Thu Feb 28 1991 00:00:36 GMT-0500 (hora estándar de Perú)')
 * a formato estándar PostgreSQL / ISO: 'YYYY-MM-DD'.
 */
export function normalizarFechaIso(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;

  // 1. Si es un objeto Date nativo de JS
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = val.getMonth() + 1;
    const d = val.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // 2. Si es un número serial de Excel (ej: 33297)
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return null;
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      }
    } catch {
      const excelEpoch = new Date(1899, 11, 30);
      const targetDate = new Date(excelEpoch.getTime() + val * 86400000);
      if (!isNaN(targetDate.getTime())) {
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth() + 1;
        const d = targetDate.getDate();
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  const s = String(val).trim();
  if (!s) return null;

  // 3. Formato ISO ya estándar (YYYY-MM-DD o YYYY/MM/DD)
  const isoMatch = s.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 4. Formato tradicional DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 5. Cadena de fecha textual de JS o Excel (ej: "Thu Feb 28 1991 00:00:36 GMT-0500...")
  const parsedTs = Date.parse(s);
  if (!isNaN(parsedTs)) {
    const dt = new Date(parsedTs);
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    if (y > 1900 && y < 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Convierte una fecha ISO (YYYY-MM-DD) o cualquier valor de fecha a formato visible 'DD/MM/AAAA'.
 */
export function isoADmy(iso: any): string {
  if (!iso) return '';
  const normalizedIso = normalizarFechaIso(iso);
  if (!normalizedIso) return '';
  const parts = normalizedIso.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Convierte una cadena ingresada como DD/MM/AAAA a formato ISO YYYY-MM-DD.
 */
export function dmyAIso(str: string): string | null {
  return normalizarFechaIso(str);
}
