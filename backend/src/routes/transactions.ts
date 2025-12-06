import { Router, Request, Response } from 'express';
import * as transactionService from '../services/transactionService.js';

export const transactionsRouter = Router();

/**
 * GET /api/transactions?userId=xxx
 */
transactionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      res.status(400).json({ error: 'userId diperlukan' });
      return;
    }
    
    const transactions = await transactionService.getTransactionsByUserId(userId);
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

/**
 * GET /api/transactions/stats?userId=xxx
 */
transactionsRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      res.status(400).json({ error: 'userId diperlukan' });
      return;
    }
    
    const stats = await transactionService.getStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

/**
 * POST /api/transactions
 */
transactionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, amount, description, category } = req.body;
    
    if (!userId || !type || !amount || !description) {
      res.status(400).json({ error: 'Data tidak lengkap' });
      return;
    }
    
    if (type !== 'income' && type !== 'expense') {
      res.status(400).json({ error: 'Type harus income atau expense' });
      return;
    }
    
    const transaction = await transactionService.createFromDashboard(
      userId,
      type,
      amount,
      description,
      category
    );
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});
