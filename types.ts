export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO string
}

export interface SummaryStats {
  totalBalance: number;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  todayIncome: number;
  todayExpense: number;
  todayCount: number;
}

export enum Tab {
  HOME = 'home',
  TRANSACTIONS = 'transactions',
  SETTINGS = 'settings'
}

export interface ParsedTransactionData {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
}