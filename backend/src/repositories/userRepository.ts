import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, saveDatabase } from '../database/db.js';
import { User } from '../types/models.js';

export interface CreateUserData {
  phoneNumber: string;
  username: string;
  passwordHash: string;
  initialBalance?: number;
}

interface UserRow {
  id: string;
  phone_number: string;
  username: string;
  password_hash: string;
  initial_balance: number;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    username: row.username,
    passwordHash: row.password_hash,
    initialBalance: row.initial_balance,
    createdAt: row.created_at,
  };
}

export async function createUser(data: CreateUserData): Promise<User> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await runQuery(
    `INSERT INTO users (id, phone_number, username, password_hash, initial_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.phoneNumber, data.username, data.passwordHash, data.initialBalance || 0, now]
  );
  
  return {
    id,
    phoneNumber: data.phoneNumber,
    username: data.username,
    passwordHash: data.passwordHash,
    initialBalance: data.initialBalance || 0,
    createdAt: now,
  };
}

export async function findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
  const row = await getOne<UserRow>(
    `SELECT id, phone_number, username, password_hash, initial_balance, created_at
     FROM users WHERE phone_number = ?`,
    [phoneNumber]
  );
  
  return row ? rowToUser(row) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await getOne<UserRow>(
    `SELECT id, phone_number, username, password_hash, initial_balance, created_at
     FROM users WHERE id = ?`,
    [id]
  );
  
  return row ? rowToUser(row) : null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const row = await getOne<UserRow>(
    `SELECT id, phone_number, username, password_hash, initial_balance, created_at
     FROM users WHERE username = ?`,
    [username]
  );
  
  return row ? rowToUser(row) : null;
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await runQuery(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [passwordHash, userId]
  );
}

export async function updateUserInitialBalance(userId: string, amount: number): Promise<void> {
  await runQuery(
    `UPDATE users SET initial_balance = ? WHERE id = ?`,
    [amount, userId]
  );
}
