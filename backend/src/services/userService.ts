import { User } from '../types/models.js';
import * as userRepo from '../repositories/userRepository.js';
import { hashPassword, verifyPassword, generateRandomPassword } from '../utils/auth.js';

export interface NewUserResult {
  user: User;
  plainPassword: string;
  isNew: boolean;
}

/**
 * Find existing user or create new one
 * Returns the user and plain password (only for new users)
 */
export async function findOrCreate(phoneNumber: string): Promise<NewUserResult> {
  // Check if user exists
  const existingUser = await userRepo.findUserByPhoneNumber(phoneNumber);
  
  if (existingUser) {
    return {
      user: existingUser,
      plainPassword: '',
      isNew: false,
    };
  }
  
  // Create new user
  const plainPassword = generateRandomPassword();
  const passwordHash = await hashPassword(plainPassword);
  
  const user = await userRepo.createUser({
    phoneNumber,
    username: phoneNumber,
    passwordHash,
    initialBalance: 0,
  });
  
  return {
    user,
    plainPassword,
    isNew: true,
  };
}

/**
 * Authenticate user by phone number (for WhatsApp)
 */
export async function authenticateByPhone(phoneNumber: string): Promise<User | null> {
  return userRepo.findUserByPhoneNumber(phoneNumber);
}

/**
 * Authenticate user by username and password (for Dashboard)
 */
export async function authenticateByCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const user = await userRepo.findUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  return isValid ? user : null;
}

/**
 * Update user password
 */
export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await userRepo.updateUserPassword(userId, passwordHash);
}

/**
 * Update user's initial balance
 */
export async function updateInitialBalance(userId: string, amount: number): Promise<void> {
  await userRepo.updateUserInitialBalance(userId, amount);
}

/**
 * Get user's initial balance
 */
export async function getInitialBalance(userId: string): Promise<number> {
  const user = await userRepo.findUserById(userId);
  return user?.initialBalance || 0;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return userRepo.findUserById(userId);
}
