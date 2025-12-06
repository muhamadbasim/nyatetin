import { Router, Request, Response } from 'express';
import * as userService from '../services/userService.js';

export const authRouter = Router();

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password diperlukan' });
      return;
    }
    
    const user = await userService.authenticateByCredentials(username, password);
    
    if (!user) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }
    
    // Return user data (without password hash)
    res.json({
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      initialBalance: user.initialBalance,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

/**
 * POST /api/auth/change-password
 */
authRouter.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      res.status(400).json({ error: 'Data tidak lengkap' });
      return;
    }
    
    const user = await userService.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }
    
    // Verify current password
    const isValid = await userService.authenticateByCredentials(user.username, currentPassword);
    if (!isValid) {
      res.status(401).json({ error: 'Password saat ini salah' });
      return;
    }
    
    // Update password
    await userService.updatePassword(userId, newPassword);
    
    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});
