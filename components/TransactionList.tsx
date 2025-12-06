import React from 'react';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-gray-400 dark:text-slate-500 px-4 text-center transition-colors">
        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-full mb-4 transition-colors">
          <Calendar size={40} />
        </div>
        <p className="font-medium text-gray-600 dark:text-slate-300">Belum ada transaksi</p>
        <p className="text-sm">Mulai catat pengeluaranmu hari ini.</p>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 transition-colors">Riwayat Transaksi</h2>
      <div className="space-y-3">
        {sortedTransactions.map((t) => (
          <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                t.type === 'income' 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-slate-200">{t.description}</p>
                <div className="flex gap-2 text-xs text-gray-500 dark:text-slate-400">
                  <span>{t.category}</span>
                  <span>•</span>
                  <span>{formatDate(t.date)}</span>
                </div>
              </div>
            </div>
            <div className={`font-bold ${
              t.type === 'income' 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};