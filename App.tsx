import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { BottomNav } from './components/BottomNav';
import { TransactionList } from './components/TransactionList';
import { Settings } from './components/Settings';
import { AIMagicModal } from './components/AIMagicModal';
import { Login } from './components/Login';
import { Transaction, Tab, SummaryStats, ParsedTransactionData } from './types';
import { apiService, LoginResponse, Transaction as ApiTransaction } from './services/apiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalBalance: 0,
    initialBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    todayIncome: 0,
    todayExpense: 0,
    todayCount: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<LoginResponse | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Check if already logged in
  useEffect(() => {
    const storedUser = apiService.getStoredUser();
    if (storedUser && apiService.isLoggedIn()) {
      setUser(storedUser);
      setIsLoggedIn(true);
    }
  }, []);

  // Convert API transaction to local format
  const convertTransaction = (t: ApiTransaction): Transaction => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    description: t.description,
    date: t.createdAt,
  });

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const [txData, statsData] = await Promise.all([
        apiService.getTransactions(),
        apiService.getStats(),
      ]);
      
      setTransactions(txData.map(convertTransaction));
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [isLoggedIn]);

  // Fetch data on login and periodically
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchData]);

  const handleLogin = (loggedInUser: LoginResponse) => {
    setUser(loggedInUser);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    apiService.clearUserId();
    setUser(null);
    setIsLoggedIn(false);
    setTransactions([]);
    setStats({
      totalBalance: 0,
      initialBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      todayIncome: 0,
      todayExpense: 0,
      todayCount: 0,
    });
  };

  const handleAddTransaction = async (data: ParsedTransactionData) => {
    try {
      await apiService.addTransaction(data.type, data.amount, data.description, data.category);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleClearData = () => {
    // For now, just logout since we can't delete server data easily
    handleLogout();
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await apiService.deleteTransaction(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleEditTransaction = async (id: string, data: { amount: number; description: string; category: string }) => {
    try {
      await apiService.updateTransaction(id, data.amount, data.description, data.category);
      await fetchData();
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  // Show login if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 max-w-md mx-auto shadow-2xl overflow-hidden relative transition-colors duration-200">
      
      {/* Content Area */}
      <main className="h-full min-h-screen">
        {activeTab === Tab.HOME && (
          <Dashboard 
            stats={stats} 
            onOpenAIModal={() => setIsModalOpen(true)} 
          />
        )}
        {activeTab === Tab.TRANSACTIONS && (
          <TransactionList 
            transactions={transactions} 
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
          />
        )}
        {activeTab === Tab.SETTINGS && (
            <Settings 
              onClearData={handleClearData} 
              isDarkMode={isDarkMode}
              toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onLogout={handleLogout}
              user={user}
            />
        )}
      </main>

      {/* Modals & Overlays */}
      <AIMagicModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      {/* Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
