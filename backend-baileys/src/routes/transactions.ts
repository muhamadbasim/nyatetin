import { Router } from 'express';
import { db } from '../database';
import { v4 as uuidv4 } from 'uuid';

export const transactionRoutes = Router();

transactionRoutes.get('/', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId diperlukan' });
  }
  
  const transactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(userId);
  
  res.json(transactions);
});

transactionRoutes.get('/stats', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId diperlukan' });
  }
  
  const user = db.prepare('SELECT initial_balance FROM users WHERE id = ?').get(userId) as any;
  const initialBalance = user?.initial_balance || 0;
  
  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
    FROM transactions 
    WHERE user_id = ?
  `).get(userId) as any;
  
  const currentBalance = initialBalance + (stats.totalIncome || 0) - (stats.totalExpense || 0);
  
  res.json({
    initialBalance,
    totalIncome: stats.totalIncome || 0,
    totalExpense: stats.totalExpense || 0,
    currentBalance
  });
});

transactionRoutes.post('/', (req, res) => {
  const { userId, type, amount, description, category } = req.body;
  
  if (!userId || !type || !amount) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO transactions (id, user_id, type, amount, description, category, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'dashboard', ?)
  `).run(id, userId, type, amount, description || '', category || 'Lainnya', now);
  
  res.json({ success: true, id });
});
