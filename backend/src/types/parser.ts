export type CommandType = 'income' | 'expense' | 'set_balance' | 'get_balance' | 'help' | 'unknown';

export interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  description: string;
}

export interface ParseResult {
  success: boolean;
  command: CommandType;
  data?: ParsedTransaction | { amount: number };
  error?: string;
}
