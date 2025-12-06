import { Hono } from 'hono';
import { Env } from '../index';

export const userRoutes = new Hono<{ Bindings: Env }>();

userRoutes.get('/balance', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'userId diperlukan' }, 400);

  const user = await c.env.DB.prepare(
    'SELECT initial_balance FROM users WHERE id = ?'
  ).bind(userId).first();

  return c.json({ initialBalance: (user?.initial_balance as number) || 0 });
});

userRoutes.put('/balance', async (c) => {
  const { userId, amount } = await c.req.json();

  if (!userId || amount === undefined) {
    return c.json({ error: 'userId dan amount diperlukan' }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE users SET initial_balance = ? WHERE id = ?'
  ).bind(amount, userId).run();

  return c.json({ message: 'Saldo awal berhasil diperbarui', initialBalance: amount });
});

// Sync user from Baileys backend
userRoutes.post('/sync', async (c) => {
  const { id, phoneNumber, username, passwordHash, initialBalance } = await c.req.json();

  if (!id || !phoneNumber || !username || !passwordHash) {
    return c.json({ error: 'Data tidak lengkap' }, 400);
  }

  // Check if user exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE phone_number = ?'
  ).bind(phoneNumber).first();

  if (existing) {
    // Update existing user
    await c.env.DB.prepare(
      'UPDATE users SET username = ?, password_hash = ?, initial_balance = ? WHERE phone_number = ?'
    ).bind(username, passwordHash, initialBalance || 0, phoneNumber).run();
  } else {
    // Insert new user
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      'INSERT INTO users (id, phone_number, username, password_hash, initial_balance, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, phoneNumber, username, passwordHash, initialBalance || 0, now).run();
  }

  return c.json({ success: true, message: 'User synced' });
});

userRoutes.get('/:userId', async (c) => {
  const userId = c.req.param('userId');

  const user = await c.env.DB.prepare(
    'SELECT id, phone_number, username, initial_balance FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  return c.json({
    id: user.id,
    username: user.username,
    phoneNumber: user.phone_number,
    initialBalance: user.initial_balance,
  });
});
