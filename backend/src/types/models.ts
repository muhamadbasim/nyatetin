export interface User {
  id: string;
  phoneNumber: string;
  username: string;
  passwordHash: string;
  initialBalance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  source: 'whatsapp' | 'dashboard';
  createdAt: string;
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
