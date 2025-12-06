const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://catat-uang-api.muhamadbasim.workers.dev/api';

export interface LoginResponse {
  id: string;
  username: string;
  phoneNumber: string;
  initialBalance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  source: 'whatsapp' | 'dashboard';
  createdAt: string;
}

export interface SummaryStats {
  totalBalance: number;
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  todayIncome: number;
  todayExpense: number;
  todayCount: number;
}

class ApiService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  getUserId(): string | null {
    if (!this.userId) {
      this.userId = localStorage.getItem('userId');
    }
    return this.userId;
  }

  clearUserId() {
    this.userId = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login gagal');
    }

    const user = await response.json();
    this.setUserId(user.id);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) throw new Error('Belum login');

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Gagal mengubah password');
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    const userId = this.getUserId();
    if (!userId) return [];

    const response = await fetch(`${API_BASE_URL}/transactions?userId=${userId}`);
    if (!response.ok) throw new Error('Gagal mengambil transaksi');
    return response.json();
  }

  async getStats(): Promise<SummaryStats> {
    const userId = this.getUserId();
    if (!userId) {
      return {
        totalBalance: 0,
        initialBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        todayIncome: 0,
        todayExpense: 0,
        todayCount: 0,
      };
    }

    const response = await fetch(`${API_BASE_URL}/transactions/stats?userId=${userId}`);
    if (!response.ok) throw new Error('Gagal mengambil statistik');
    return response.json();
  }

  async addTransaction(
    type: 'income' | 'expense',
    amount: number,
    description: string,
    category?: string
  ): Promise<Transaction> {
    const userId = this.getUserId();
    if (!userId) throw new Error('Belum login');

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, amount, description, category }),
    });

    if (!response.ok) throw new Error('Gagal menambah transaksi');
    return response.json();
  }

  async updateInitialBalance(amount: number): Promise<void> {
    const userId = this.getUserId();
    if (!userId) throw new Error('Belum login');

    const response = await fetch(`${API_BASE_URL}/users/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });

    if (!response.ok) throw new Error('Gagal mengubah saldo awal');
  }

  isLoggedIn(): boolean {
    return !!this.getUserId();
  }

  getStoredUser(): LoginResponse | null {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }
}

export const apiService = new ApiService();
