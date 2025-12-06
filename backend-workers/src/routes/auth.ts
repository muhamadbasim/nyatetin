import { Hono } from 'hono';
import { Env } from '../index';
import { hashPassword, verifyPassword } from '../utils/auth';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  if (!username || !password) {
    return c.json({ error: 'Username dan password diperlukan' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).bind(username).first();

  if (!user) {
    return c.json({ error: 'Username atau password salah' }, 401);
  }

  const isValid = await verifyPassword(password, user.password_hash as string);
  if (!isValid) {
    return c.json({ error: 'Username atau password salah' }, 401);
  }

  return c.json({
    id: user.id,
    username: user.username,
    phoneNumber: user.phone_number,
    initialBalance: user.initial_balance,
  });
});

authRoutes.post('/change-password', async (c) => {
  const { userId, currentPassword, newPassword } = await c.req.json();

  if (!userId || !currentPassword || !newPassword) {
    return c.json({ error: 'Data tidak lengkap' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  const isValid = await verifyPassword(currentPassword, user.password_hash as string);
  if (!isValid) {
    return c.json({ error: 'Password saat ini salah' }, 401);
  }

  const newHash = await hashPassword(newPassword);
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ? WHERE id = ?'
  ).bind(newHash, userId).run();

  return c.json({ message: 'Password berhasil diubah' });
});
