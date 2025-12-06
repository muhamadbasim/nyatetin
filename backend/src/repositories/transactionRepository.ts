import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, getAll } from '../database/db.js';
import { Transaction, SummaryStats } from '../types/models.js';

export interface CreateTransactionData {
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  source?: 'whatsapp' | 'dashboard';
}

interface TransactionRow {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  source: 'whatsapp' | 'dashboard';
  created_at: string;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    description: row.description,
    category: row.category,
    source: row.source,
    createdAt: row.created_at,
  };
}

export async function createTransaction(data: CreateTransactionData): Promise<Transaction> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await runQuery(
    `INSERT INTO transactions (id, user_id, type, amount, description, category, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.userId,
      data.type,
      data.amount,
      data.description,
      data.category || 'Lainnya',
      data.source || 'whatsapp',
      now
    ]
  );
  
  return {
    id,
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    category: data.category || 'Lainnya',
    source: data.source || 'whatsapp',
    createdAt: now,
  };
}

export async function findTransactionsByUserId(userId: string): Promise<Transaction[]> {
  const rows = await getAll<TransactionRow>(
    `SELECT id, user_id, type, amount, description, category, source, created_at
     FROM transactions 
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return rows.map(rowToTransaction);
}

export async function getStatsByUserId(userId: string, initialBalance: number): Promise<SummaryStats> {
  const today = new Date().toISOString().split('T')[0];
  
  // Get total income
  const incomeRow = await getOne<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE user_id = ? AND type = 'income'`,
    [userId]
  );
  const totalIncome = incomeRow?.total || 0;
  
  // Get total expense
  const expenseRow = await getOne<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE user_id = ? AND type = 'expense'`,
    [userId]
  );
  const totalExpense = expenseRow?.total || 0;
  
  // Get today's income
  const todayIncomeRow = await getOne<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE user_id = ? AND type = 'income' AND date(created_at) = ?`,
    [userId, today]
  );
  const todayIncome = todayIncomeRow?.total || 0;
  
  // Get today's expense
  const todayExpenseRow = await getOne<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE user_id = ? AND type = 'expense' AND date(created_at) = ?`,
    [userId, today]
  );
  const todayExpense = todayExpenseRow?.total || 0;
  
  // Get today's transaction count
  const todayCountRow = await getOne<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM transactions WHERE user_id = ? AND date(created_at) = ?`,
    [userId, today]
  );
  const todayCount = todayCountRow?.count || 0;
  
  return {
    totalBalance: initialBalance + totalIncome - totalExpense,
    initialBalance,
    totalIncome,
    totalExpense,
    todayIncome,
    todayExpense,
    todayCount,
  };
}
