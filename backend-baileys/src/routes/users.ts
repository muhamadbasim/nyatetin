import { Router } from 'express';
import { db } from '../database';

export const userRoutes = Router();

userRoutes.get('/balance', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId diperlukan' });
  }
  
  const user = db.prepare('SELECT initial_balance FROM users WHERE id = ?').get(userId) as any;
  
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  
  res.json({ initialBalance: user.initial_balance });
});

userRoutes.put('/balance', (req, res) => {
  const { userId, initialBalance } = req.body;
  
  if (!userId || initialBalance === undefined) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  
  db.prepare('UPDATE users SET initial_balance = ? WHERE id = ?').run(initialBalance, userId);
  
  res.json({ success: true });
});

userRoutes.get('/:userId', (req, res) => {
  const { userId } = req.params;
  
  const user = db.prepare('SELECT id, phone_number, username, initial_balance, created_at FROM users WHERE id = ?')
    .get(userId) as any;
  
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  
  res.json(user);
});
