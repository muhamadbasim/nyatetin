// Amount Parser
const SHORTHAND_MULTIPLIERS: Record<string, number> = {
  'rb': 1000, 'ribu': 1000, 'k': 1000,
  'jt': 1000000, 'juta': 1000000, 'm': 1000000,
};

export function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  const cleaned = amountStr.toLowerCase().trim().replace(/\s/g, '');
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)(rb|ribu|jt|juta|k|m)?$/);
  if (!match) return null;
  const [, numPart, suffix] = match;
  const num = parseFloat(numPart.replace(',', '.'));
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * (suffix ? SHORTHAND_MULTIPLIERS[suffix] : 1));
}

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// Transaction Parser
export type CommandType = 'income' | 'expense' | 'set_balance' | 'get_balance' | 'help' | 'unknown';

export interface ParseResult {
  success: boolean;
  command: CommandType;
  data?: { type?: 'income' | 'expense'; amount: number; description?: string };
  error?: string;
}

const INCOME_PATTERN = /^\+\s*(\S+)\s+(.+)$/;
const EXPENSE_PATTERN = /^-\s*(\S+)\s+(.+)$/;
const SET_BALANCE_PATTERN = /^saldo\s+awal\s+(\S+)$/i;
const GET_BALANCE_PATTERN = /^saldo\s+awal$/i;
const HELP_PATTERN = /^(bantuan|help)$/i;

export function parseMessage(message: string): ParseResult {
  const trimmed = message.trim();
  if (!trimmed) return { success: false, command: 'unknown', error: 'Pesan kosong' };

  if (HELP_PATTERN.test(trimmed)) return { success: true, command: 'help' };
  if (GET_BALANCE_PATTERN.test(trimmed)) return { success: true, command: 'get_balance' };

  const setBalanceMatch = trimmed.match(SET_BALANCE_PATTERN);
  if (setBalanceMatch) {
    const amount = parseAmount(setBalanceMatch[1]);
    if (amount === null) return { success: false, command: 'set_balance', error: 'Jumlah tidak valid' };
    return { success: true, command: 'set_balance', data: { amount } };
  }

  const incomeMatch = trimmed.match(INCOME_PATTERN);
  if (incomeMatch) {
    const amount = parseAmount(incomeMatch[1]);
    if (!amount) return { success: false, command: 'income', error: 'Jumlah tidak valid' };
    return { success: true, command: 'income', data: { type: 'income', amount, description: incomeMatch[2].trim() } };
  }

  const expenseMatch = trimmed.match(EXPENSE_PATTERN);
  if (expenseMatch) {
    const amount = parseAmount(expenseMatch[1]);
    if (!amount) return { success: false, command: 'expense', error: 'Jumlah tidak valid' };
    return { success: true, command: 'expense', data: { type: 'expense', amount, description: expenseMatch[2].trim() } };
  }

  return { success: false, command: 'unknown', error: "Format tidak dikenali. Ketik 'bantuan' untuk panduan." };
}
