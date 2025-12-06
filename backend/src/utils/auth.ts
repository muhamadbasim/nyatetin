import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const PASSWORD_LENGTH = 8;
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random password
 * Uses characters that are easy to read (no 0, O, l, 1, I)
 */
export function generateRandomPassword(): string {
  let password = '';
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * PASSWORD_CHARS.length);
    password += PASSWORD_CHARS[randomIndex];
  }
  return password;
}
