// Sync service to Cloudflare Workers API
const WORKERS_API_URL = process.env.WORKERS_API_URL || 'https://catat-uang-api.muhamadbasim.workers.dev/api';

export interface SyncUser {
  id: string;
  phoneNumber: string;
  username: string;
  passwordHash: string;
  initialBalance: number;
}

export interface SyncTransaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  source: string;
}

// Create or update user in D1
export async function syncUserToD1(user: SyncUser): Promise<boolean> {
  const url = `${WORKERS_API_URL}/users/sync`;
  console.log(`🔄 Syncing user to D1: ${url}`);
  console.log(`   Data:`, JSON.stringify(user));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    
    const responseText = await response.text();
    console.log(`   Response: ${response.status} - ${responseText}`);
    
    if (!response.ok) {
      console.error('❌ Failed to sync user to D1:', responseText);
      return false;
    }
    
    console.log(`✅ User ${user.phoneNumber} synced to D1`);
    return true;
  } catch (error) {
    console.error('❌ Error syncing user to D1:', error);
    return false;
  }
}

// Create transaction in D1
export async function syncTransactionToD1(tx: SyncTransaction): Promise<boolean> {
  const url = `${WORKERS_API_URL}/transactions/sync`;
  console.log(`🔄 Syncing transaction to D1: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    
    const responseText = await response.text();
    console.log(`   Response: ${response.status} - ${responseText}`);
    
    if (!response.ok) {
      console.error('❌ Failed to sync transaction to D1:', responseText);
      return false;
    }
    
    console.log(`✅ Transaction ${tx.id} synced to D1`);
    return true;
  } catch (error) {
    console.error('❌ Error syncing transaction to D1:', error);
    return false;
  }
}

// Update user balance in D1
export async function syncBalanceToD1(userId: string, amount: number): Promise<boolean> {
  try {
    const response = await fetch(`${WORKERS_API_URL}/users/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });
    
    if (!response.ok) {
      console.error('Failed to sync balance to D1:', await response.text());
      return false;
    }
    
    console.log(`✅ Balance synced to D1 for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error syncing balance to D1:', error);
    return false;
  }
}
