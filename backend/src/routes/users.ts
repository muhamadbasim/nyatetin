import { Router, Request, Response } from 'express';
import * as userService from '../services/userService.js';

export const usersRouter = Router();

/**
 * GET /api/users/balance?userId=xxx
 */
usersRouter.get('/balance', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      res.status(400).json({ error: 'userId diperlukan' });
      return;
    }
    
    const balance = await userService.getInitialBalance(userId);
    res.json({ initialBalance: balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

/**
 * PUT /api/users/balance
 */
usersRouter.put('/balance', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    
    if (!userId || amount === undefined) {
      res.status(400).json({ error: 'userId dan amount diperlukan' });
      return;
    }
    
    await userService.updateInitialBalance(userId, amount);
    res.json({ message: 'Saldo awal berhasil diperbarui', initialBalance: amount });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

/**
 * GET /api/users/:userId
 */
usersRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await userService.getUserById(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }
    
    res.json({
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      initialBalance: user.initialBalance,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});
