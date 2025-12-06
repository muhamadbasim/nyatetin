interface ParseResult {
  success: boolean;
  command?: 'income' | 'expense' | 'get_balance' | 'set_balance' | 'help' | 'reset';
  data?: {
    type?: 'income' | 'expense';
    amount: number;
    description?: string;
  };
  error?: string;
}

export function parseMessage(text: string): ParseResult {
  const trimmed = text.trim().toLowerCase();
  
  // Help command
  if (trimmed === 'bantuan' || trimmed === 'help' || trimmed === '?') {
    return { success: true, command: 'help' };
  }
  
  // Reset command (for testing)
  if (trimmed === 'reset' || trimmed === 'reset akun') {
    return { success: true, command: 'reset' };
  }
  
  // Get balance
  if (trimmed === 'saldo' || trimmed === 'balance') {
    return { success: true, command: 'get_balance' };
  }
  
  // Set balance: "saldo awal 1000000"
  const setBalanceMatch = trimmed.match(/^saldo\s+awal\s+(.+)$/i);
  if (setBalanceMatch) {
    const amount = parseAmount(setBalanceMatch[1]);
    if (amount === null) {
      return { success: false, error: 'Format angka tidak valid' };
    }
    return { success: true, command: 'set_balance', data: { amount } };
  }
  
  // Income: "+ 50000 description" or "masuk 50000 gaji"
  const incomeMatch = text.trim().match(/^\+\s*(.+)$/);
  if (incomeMatch) {
    const parsed = parseTransaction(incomeMatch[1]);
    if (!parsed) {
      return { success: false, error: 'Format: + [jumlah] [keterangan]' };
    }
    return { 
      success: true, 
      command: 'income', 
      data: { type: 'income', ...parsed } 
    };
  }
  
  // Income with keyword: "masuk 50000 gaji" or "terima 500rb freelance"
  const incomeKeywords = /^(masuk|terima|dapat|income|pemasukan)\s+(.+)$/i;
  const incomeKeywordMatch = text.trim().match(incomeKeywords);
  if (incomeKeywordMatch) {
    const parsed = parseTransaction(incomeKeywordMatch[2]);
    if (!parsed) {
      return { success: false, error: 'Format: masuk [jumlah] [keterangan]' };
    }
    return { 
      success: true, 
      command: 'income', 
      data: { type: 'income', ...parsed } 
    };
  }
  
  // Expense: "- 50000 description"
  const expenseMatch = text.trim().match(/^-\s*(.+)$/);
  if (expenseMatch) {
    const parsed = parseTransaction(expenseMatch[1]);
    if (!parsed) {
      return { success: false, error: 'Format: - [jumlah] [keterangan]' };
    }
    return { 
      success: true, 
      command: 'expense', 
      data: { type: 'expense', ...parsed } 
    };
  }
  
  // Expense with keyword: "keluar 50000 makan" or "bayar 100rb listrik"
  const expenseKeywords = /^(keluar|bayar|beli|expense|pengeluaran)\s+(.+)$/i;
  const expenseKeywordMatch = text.trim().match(expenseKeywords);
  if (expenseKeywordMatch) {
    const parsed = parseTransaction(expenseKeywordMatch[2]);
    if (!parsed) {
      return { success: false, error: 'Format: keluar [jumlah] [keterangan]' };
    }
    return { 
      success: true, 
      command: 'expense', 
      data: { type: 'expense', ...parsed } 
    };
  }
  
  // Default: treat as expense if it looks like a transaction (e.g., "50rb makan")
  const defaultParsed = parseTransaction(text.trim());
  if (defaultParsed) {
    return { 
      success: true, 
      command: 'expense', 
      data: { type: 'expense', ...defaultParsed } 
    };
  }
  
  return { success: false };
}

function parseTransaction(text: string): { amount: number; description: string } | null {
  // Match: "50000 makan siang" or "50rb kopi" or "1.5jt listrik"
  const match = text.match(/^([\d.,]+\s*(?:rb|ribu|jt|juta|k)?)\s+(.+)$/i);
  if (!match) return null;
  
  const amount = parseAmount(match[1]);
  if (amount === null) return null;
  
  return { amount, description: match[2].trim() };
}

function parseAmount(text: string): number | null {
  let str = text.toLowerCase().replace(/\s/g, '').replace(/,/g, '.');
  
  let multiplier = 1;
  if (str.includes('jt') || str.includes('juta')) {
    multiplier = 1000000;
    str = str.replace(/jt|juta/g, '');
  } else if (str.includes('rb') || str.includes('ribu')) {
    multiplier = 1000;
    str = str.replace(/rb|ribu/g, '');
  } else if (str.includes('k')) {
    multiplier = 1000;
    str = str.replace(/k/g, '');
  }
  
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  
  return Math.round(num * multiplier);
}
