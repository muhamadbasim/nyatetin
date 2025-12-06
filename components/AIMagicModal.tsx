import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2 } from 'lucide-react';
import { TransactionType, ParsedTransactionData } from '../types';
import { parseTransactionWithGemini } from '../services/geminiService';

interface AIMagicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (data: ParsedTransactionData) => void;
}

export const AIMagicModal: React.FC<AIMagicModalProps> = ({ isOpen, onClose, onAddTransaction }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Manual Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<TransactionType>('expense');

  if (!isOpen) return null;

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const result = await parseTransactionWithGemini(text);
      if (result) {
        onAddTransaction(result);
        setText('');
        onClose();
      } else {
        // Fallback if AI fails or no API key
        setManualMode(true);
        setDescription(text);
      }
    } catch (err) {
      console.error(err);
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      amount: Number(amount),
      description,
      category: category || 'General',
      type
    });
    // Reset
    setAmount('');
    setDescription('');
    setCategory('');
    setManualMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold">{manualMode ? 'Catat Manual' : 'Catat Pintar AI'}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!manualMode ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-slate-300 text-sm">
                Ketik transaksi Anda senatural mungkin. AI akan mengategorikannya.
              </p>
              <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 italic">
                Contoh: "Beli kopi di Starbucks 50rb" atau "Gaji masuk 5 juta"
              </div>
              
              <form onSubmit={handleAISubmit} className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ketik disini..."
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-32 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  autoFocus
                />
                
                <button
                  type="submit"
                  disabled={loading || !text}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                  {loading ? 'Memproses...' : 'Proses dengan AI'}
                </button>
                
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setManualMode(true)}
                    className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline"
                  >
                    Atau catat manual
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tipe</label>
                <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'expense' ? 'bg-white dark:bg-slate-600 text-rose-600 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${type === 'income' ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  placeholder="Contoh: Makan siang"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kategori</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  placeholder="Contoh: Makanan"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setManualMode(false)}
                  className="flex-1 py-3 text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};