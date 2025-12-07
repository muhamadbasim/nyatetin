import AnimatedBalance from './AnimatedBalance';
import React from 'react';
import { Wallet, TrendingUp, TrendingDown, MessageCircle, ArrowRight } from 'lucide-react';
import { SummaryStats } from '../types';

interface DashboardProps {
  stats: SummaryStats;
  onOpenAIModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, onOpenAIModal }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="pb-24 pt-4 px-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Nyatetin
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {getGreeting()} 👋
          </p>
        </div>
        <div className="text-3xl animate-bounce">📝</div>
      </header>

      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden transition-all animate-gradient">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="flex items-center gap-2 text-emerald-100 text-sm font-medium">
            <span className="bg-emerald-700/50 p-1 rounded">💰</span>
            <span>Saldo Total</span>
          </div>
          <Wallet className="w-6 h-6 text-emerald-200" />
        </div>
        
        <div className="relative z-10">
          <AnimatedBalance balance={stats.totalBalance} />
          <p className="text-xs text-emerald-200">
            Kumulatif semua waktu • {stats.todayCount} transaksi hari ini
          </p>
        </div>
      </div>

      {/* Breakdown Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-400 dark:text-slate-500">$</span>
          <h3 className="font-semibold text-gray-800 dark:text-white">Breakdown Keseluruhan</h3>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <div className="w-1 h-4 bg-gray-300 dark:bg-slate-600 rounded-full"></div>
              <span>Saldo Awal</span>
            </div>
            <span className="font-medium text-gray-700 dark:text-slate-200">{formatCurrency(stats.initialBalance)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
              <span>Total Pemasukan</span>
            </div>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">+{formatCurrency(stats.totalIncome)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <div className="w-1 h-4 bg-rose-400 rounded-full"></div>
              <span>Total Pengeluaran</span>
            </div>
            <span className="font-medium text-rose-600 dark:text-rose-400">-{formatCurrency(stats.totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* Daily Section Header */}
      <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-slate-600 text-sm transition-colors">
        <div className="h-px w-8 bg-gray-300 dark:bg-slate-700"></div>
        <span>Hari Ini</span>
        <div className="h-px w-8 bg-gray-300 dark:bg-slate-700"></div>
      </div>

      {/* Daily Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Income */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm">
              <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={14} />
              </div>
              <span>Masuk</span>
            </div>
            <TrendingUp className="text-emerald-500 dark:text-emerald-400 w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.todayIncome)}</p>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-rose-100 dark:border-rose-900/30 relative transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm">
              <div className="p-1 bg-rose-100 dark:bg-rose-900/50 rounded text-rose-600 dark:text-rose-400">
                <TrendingDown size={14} />
              </div>
              <span>Keluar</span>
            </div>
            <TrendingDown className="text-rose-500 dark:text-rose-400 w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(stats.todayExpense)}</p>
        </div>
      </div>

      {/* Transaction Count */}
      <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center transition-colors">
        <span className="text-gray-600 dark:text-slate-300">Transaksi Hari Ini</span>
        <span className="font-bold text-gray-800 dark:text-white">{stats.todayCount}</span>
      </div>

      {/* AI Quick Add CTA */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between gap-4 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" onClick={onOpenAIModal}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
             <MessageCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 dark:text-white">Catat Transaksi AI</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400">Ketik pesan natural ke AI</p>
          </div>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
          Buka
        </button>
      </div>

    </div>
  );
};