import { Router } from 'express';
import { db } from '../database';
import { verifyPassword, hashPassword } from '../utils/auth';

export const authRoutes = Router();

authRoutes.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password diperlukan' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone_number = ?')
    .get(username, username) as any;
  
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      phoneNumber: user.phone_number,
      initialBalance: user.initial_balance
    }
  });
});

authRoutes.post('/change-password', (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Password lama salah' });
  }
  
  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
  
  res.json({ success: true });
});
