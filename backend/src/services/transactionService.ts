import { Transaction, SummaryStats } from '../types/models.js';
import { ParsedTransaction } from '../types/parser.js';
import * as transactionRepo from '../repositories/transactionRepository.js';
import * as userService from './userService.js';

/**
 * Create a new transaction from parsed WhatsApp message
 */
export async function createFromWhatsApp(userId: string, data: ParsedTransaction): Promise<Transaction> {
  return transactionRepo.createTransaction({
    userId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    source: 'whatsapp',
  });
}

/**
 * Create a new transaction from dashboard
 */
export async function createFromDashboard(
  userId: string,
  type: 'income' | 'expense',
  amount: number,
  description: string,
  category?: string
): Promise<Transaction> {
  return transactionRepo.createTransaction({
    userId,
    type,
    amount,
    description,
    category,
    source: 'dashboard',
  });
}

/**
 * Get all transactions for a user
 */
export async function getTransactionsByUserId(userId: string): Promise<Transaction[]> {
  return transactionRepo.findTransactionsByUserId(userId);
}

/**
 * Get summary statistics for a user
 */
export async function getStats(userId: string): Promise<SummaryStats> {
  const initialBalance = await userService.getInitialBalance(userId);
  return transactionRepo.getStatsByUserId(userId, initialBalance);
}
