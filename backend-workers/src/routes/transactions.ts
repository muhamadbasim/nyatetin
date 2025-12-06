import { Hono } from 'hono';
import { Env } from '../index';

export const transactionRoutes = new Hono<{ Bindings: Env }>();

transactionRoutes.get('/', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'userId diperlukan' }, 400);

  const { results } = await c.env.DB.prepare(
    `SELECT id, user_id as userId, type, amount, description, category, source, created_at as createdAt
     FROM transactions WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(userId).all();

  return c.json(results);
});

transactionRoutes.get('/stats', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'userId diperlukan' }, 400);

  const today = new Date().toISOString().split('T')[0];

  // Get user's initial balance
  const user = await c.env.DB.prepare(
    'SELECT initial_balance FROM users WHERE id = ?'
  ).bind(userId).first();
  const initialBalance = (user?.initial_balance as number) || 0;

  // Get totals
  const income = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income'`
  ).bind(userId).first();

  const expense = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense'`
  ).bind(userId).first();

  const todayIncome = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income' AND date(created_at) = ?`
  ).bind(userId, today).first();

  const todayExpense = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date(created_at) = ?`
  ).bind(userId, today).first();

  const todayCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND date(created_at) = ?`
  ).bind(userId, today).first();

  const totalIncome = (income?.total as number) || 0;
  const totalExpense = (expense?.total as number) || 0;

  return c.json({
    totalBalance: initialBalance + totalIncome - totalExpense,
    initialBalance,
    totalIncome,
    totalExpense,
    todayIncome: (todayIncome?.total as number) || 0,
    todayExpense: (todayExpense?.total as number) || 0,
    todayCount: (todayCount?.count as number) || 0,
  });
});

transactionRoutes.post('/', async (c) => {
  const { userId, type, amount, description, category } = await c.req.json();

  if (!userId || !type || !amount || !description) {
    return c.json({ error: 'Data tidak lengkap' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO transactions (id, user_id, type, amount, description, category, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'dashboard', ?)`
  ).bind(id, userId, type, amount, description, category || 'Lainnya', now).run();

  return c.json({ id, userId, type, amount, description, category: category || 'Lainnya', source: 'dashboard', createdAt: now }, 201);
});

// Sync transaction from Baileys backend
transactionRoutes.post('/sync', async (c) => {
  const { id, userId, type, amount, description, category, source } = await c.req.json();

  if (!id || !userId || !type || !amount) {
    return c.json({ error: 'Data tidak lengkap' }, 400);
  }

  // Check if transaction already exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM transactions WHERE id = ?'
  ).bind(id).first();

  if (existing) {
    return c.json({ success: true, message: 'Transaction already exists' });
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO transactions (id, user_id, type, amount, description, category, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, userId, type, amount, description || '', category || 'Lainnya', source || 'whatsapp', now).run();

  return c.json({ success: true, message: 'Transaction synced' }, 201);
});
