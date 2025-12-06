import { ParseResult, CommandType, ParsedTransaction } from '../types/parser.js';
import { parseAmount } from '../utils/amountParser.js';

/**
 * Transaction Parser - Parses WhatsApp messages into transaction commands
 * 
 * Supported formats:
 * - Income: "+ 20000 makan siang" or "+20rb gaji"
 * - Expense: "- 15000 bensin" or "-15rb transport"
 * - Set balance: "saldo awal 1000000" or "saldo awal 1jt"
 * - Get balance: "saldo awal" (without amount)
 * - Help: "bantuan" or "help"
 */

const INCOME_PATTERN = /^\+\s*(\S+)\s+(.+)$/;
const EXPENSE_PATTERN = /^-\s*(\S+)\s+(.+)$/;
const SET_BALANCE_PATTERN = /^saldo\s+awal\s+(\S+)$/i;
const GET_BALANCE_PATTERN = /^saldo\s+awal$/i;
const HELP_PATTERN = /^(bantuan|help)$/i;

export function parseMessage(message: string): ParseResult {
  const trimmed = message.trim();
  
  if (!trimmed) {
    return {
      success: false,
      command: 'unknown',
      error: 'Pesan kosong',
    };
  }

  // Check for help command
  if (HELP_PATTERN.test(trimmed)) {
    return {
      success: true,
      command: 'help',
    };
  }

  // Check for get balance command
  if (GET_BALANCE_PATTERN.test(trimmed)) {
    return {
      success: true,
      command: 'get_balance',
    };
  }

  // Check for set balance command
  const setBalanceMatch = trimmed.match(SET_BALANCE_PATTERN);
  if (setBalanceMatch) {
    const amount = parseAmount(setBalanceMatch[1]);
    if (amount === null || amount < 0) {
      return {
        success: false,
        command: 'set_balance',
        error: 'Jumlah saldo tidak valid. Contoh: saldo awal 1000000',
      };
    }
    return {
      success: true,
      command: 'set_balance',
      data: { amount },
    };
  }

  // Check for income transaction
  const incomeMatch = trimmed.match(INCOME_PATTERN);
  if (incomeMatch) {
    const amount = parseAmount(incomeMatch[1]);
    const description = incomeMatch[2].trim();
    
    if (amount === null || amount <= 0) {
      return {
        success: false,
        command: 'income',
        error: 'Jumlah tidak valid. Contoh: + 20000 makan siang',
      };
    }
    
    if (!description) {
      return {
        success: false,
        command: 'income',
        error: 'Deskripsi tidak boleh kosong. Contoh: + 20000 makan siang',
      };
    }

    return {
      success: true,
      command: 'income',
      data: {
        type: 'income',
        amount,
        description,
      } as ParsedTransaction,
    };
  }

  // Check for expense transaction
  const expenseMatch = trimmed.match(EXPENSE_PATTERN);
  if (expenseMatch) {
    const amount = parseAmount(expenseMatch[1]);
    const description = expenseMatch[2].trim();
    
    if (amount === null || amount <= 0) {
      return {
        success: false,
        command: 'expense',
        error: 'Jumlah tidak valid. Contoh: - 15000 bensin',
      };
    }
    
    if (!description) {
      return {
        success: false,
        command: 'expense',
        error: 'Deskripsi tidak boleh kosong. Contoh: - 15000 bensin',
      };
    }

    return {
      success: true,
      command: 'expense',
      data: {
        type: 'expense',
        amount,
        description,
      } as ParsedTransaction,
    };
  }

  // Unknown command
  return {
    success: false,
    command: 'unknown',
    error: "Format tidak dikenali. Ketik 'bantuan' untuk panduan.",
  };
}

/**
 * Format a transaction back to message string (for round-trip testing)
 */
export function formatTransaction(transaction: ParsedTransaction): string {
  const prefix = transaction.type === 'income' ? '+' : '-';
  return `${prefix} ${transaction.amount} ${transaction.description}`;
}
