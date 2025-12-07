import React, { useState } from 'react';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, Calendar, Trash2, Edit2, X, Check } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string, data: { amount: number; description: string; category: string }) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onDelete,
  onEdit 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: '', description: '', category: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditData({
      amount: t.amount.toString(),
      description: t.description,
      category: t.category,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ amount: '', description: '', category: '' });
  };

  const saveEdit = (id: string) => {
    if (onEdit && editData.amount && editData.description) {
      onEdit(id, {
        amount: parseInt(editData.amount),
        description: editData.description,
        category: editData.category || 'Lainnya',
      });
    }
    cancelEdit();
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete?.(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
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
          <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
            {editingId === t.id ? (
              <div className="space-y-3">
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Jumlah"
                />
                <input
                  type="text"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Keterangan"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(t.id)}
                    className="flex-1 bg-emerald-500 text-white p-2 rounded-lg flex items-center justify-center gap-1"
                  >
                    <Check size={16} /> Simpan
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-white p-2 rounded-lg flex items-center justify-center gap-1"
                  >
                    <X size={16} /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.type === 'income' 
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>
                    {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-slate-200 truncate">{t.description}</p>
                    <div className="flex gap-2 text-xs text-gray-500 dark:text-slate-400">
                      <span>{t.category}</span>
                      <span>•</span>
                      <span>{formatDate(t.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`font-bold ${
                    t.type === 'income' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    <AnimatedNumber 
                      value={t.amount} 
                      prefix={t.type === 'income' ? '+Rp ' : '-Rp '} 
                      className={`font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                      duration={600}
                    />
                  </div>
                  {(onEdit || onDelete) && (
                    <div className="flex gap-1 ml-2">
                      {onEdit && (
                        <button
                          onClick={() => startEdit(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className={`p-1.5 transition-colors ${
                            deleteConfirm === t.id 
                              ? 'text-red-500' 
                              : 'text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
