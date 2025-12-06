/**
 * Amount Parser - Handles Indonesian currency shorthand notation
 * Supports: rb (ribu/thousand), jt (juta/million), k (thousand)
 */

const SHORTHAND_MULTIPLIERS: Record<string, number> = {
  'rb': 1000,
  'ribu': 1000,
  'k': 1000,
  'jt': 1000000,
  'juta': 1000000,
  'm': 1000000,
};

/**
 * Parse amount string with shorthand support
 * Examples: "20000", "20rb", "20ribu", "1jt", "1.5jt"
 */
export function parseAmount(amountStr: string): number | null {
  if (!amountStr || typeof amountStr !== 'string') {
    return null;
  }

  const cleaned = amountStr.toLowerCase().trim().replace(/\s/g, '');
  
  // Try to match number with optional shorthand suffix
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)(rb|ribu|jt|juta|k|m)?$/);
  
  if (!match) {
    return null;
  }

  const [, numPart, suffix] = match;
  const num = parseFloat(numPart.replace(',', '.'));

  if (isNaN(num) || num < 0) {
    return null;
  }

  const multiplier = suffix ? SHORTHAND_MULTIPLIERS[suffix] : 1;
  return Math.round(num * multiplier);
}

/**
 * Format amount to Indonesian shorthand notation
 * Examples: 20000 -> "20rb", 1500000 -> "1.5jt"
 */
export function formatAmount(amount: number): string {
  if (amount >= 1000000) {
    const juta = amount / 1000000;
    return Number.isInteger(juta) ? `${juta}jt` : `${juta.toFixed(1).replace('.0', '')}jt`;
  }
  
  if (amount >= 1000) {
    const ribu = amount / 1000;
    return Number.isInteger(ribu) ? `${ribu}rb` : `${ribu.toFixed(1).replace('.0', '')}rb`;
  }
  
  return amount.toString();
}

/**
 * Format amount to full Indonesian Rupiah format
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
