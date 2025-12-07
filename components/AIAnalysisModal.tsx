import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, TrendingDown, PieChart, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';
import { GoogleGenAI } from '@google/genai';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
}

interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  transactions,
  totalIncome,
  totalExpense,
  totalBalance
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [expenseByCategory, setExpenseByCategory] = useState<CategorySummary[]>([]);
  const [incomeByCategory, setIncomeByCategory] = useState<CategorySummary[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate category summaries
  useEffect(() => {
    if (!isOpen) return;

    const expenseMap = new Map<string, { amount: number; count: number }>();
    const incomeMap = new Map<string, { amount: number; count: number }>();

    transactions.forEach(t => {
      const cat = t.category || t.description || 'Lainnya';
      if (t.type === 'expense') {
        const existing = expenseMap.get(cat) || { amount: 0, count: 0 };
        expenseMap.set(cat, { amount: existing.amount + t.amount, count: existing.count + 1 });
      } else {
        const existing = incomeMap.get(cat) || { amount: 0, count: 0 };
        incomeMap.set(cat, { amount: existing.amount + t.amount, count: existing.count + 1 });
      }
    });

    const expenseSummary: CategorySummary[] = Array.from(expenseMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);

    const incomeSummary: CategorySummary[] = Array.from(incomeMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);

    setExpenseByCategory(expenseSummary);
    setIncomeByCategory(incomeSummary);
  }, [isOpen, transactions, totalExpense, totalIncome]);

  const generateAIAnalysis = async () => {
    setLoading(true);
    setAnalysis('');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        // Fallback analysis without AI
        generateLocalAnalysis();
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const expenseData = expenseByCategory.map(c => `${c.category}: ${formatCurrency(c.amount)} (${c.percentage.toFixed(1)}%)`).join('\n');
      const incomeData = incomeByCategory.map(c => `${c.category}: ${formatCurrency(c.amount)} (${c.percentage.toFixed(1)}%)`).join('\n');

      const prompt = `Kamu adalah asisten keuangan pribadi yang ramah. Analisa data keuangan berikut dan berikan rekomendasi dalam Bahasa Indonesia yang mudah dipahami.

DATA KEUANGAN:
- Total Pemasukan: ${formatCurrency(totalIncome)}
- Total Pengeluaran: ${formatCurrency(totalExpense)}
- Saldo: ${formatCurrency(totalBalance)}
- Jumlah Transaksi: ${transactions.length}

PENGELUARAN PER KATEGORI:
${expenseData || 'Belum ada data'}

PEMASUKAN PER KATEGORI:
${incomeData || 'Belum ada data'}

Berikan analisa singkat (maksimal 200 kata) yang mencakup:
1. Ringkasan kondisi keuangan
2. Kategori pengeluaran terbesar dan saran penghematan
3. Tips praktis untuk meningkatkan kesehatan keuangan

Gunakan emoji untuk membuat lebih menarik. Jangan gunakan format markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: prompt,
      });

      setAnalysis(response.text || 'Tidak dapat menghasilkan analisa.');
    } catch (error) {
      console.error('AI Analysis error:', error);
      generateLocalAnalysis();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalAnalysis = () => {
    let tips: string[] = [];
    
    // Analyze spending ratio
    const spendingRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
    
    if (spendingRatio > 80) {
      tips.push('⚠️ Pengeluaranmu sudah lebih dari 80% pemasukan. Coba kurangi pengeluaran non-esensial.');
    } else if (spendingRatio > 50) {
      tips.push('📊 Pengeluaranmu sekitar ' + spendingRatio.toFixed(0) + '% dari pemasukan. Masih aman, tapi bisa ditingkatkan.');
    } else if (spendingRatio > 0) {
      tips.push('🎉 Bagus! Kamu berhasil menyimpan lebih dari 50% pemasukan.');
    }

    // Top expense category
    if (expenseByCategory.length > 0) {
      const top = expenseByCategory[0];
      tips.push(`💸 Pengeluaran terbesar: ${top.category} (${formatCurrency(top.amount)} - ${top.percentage.toFixed(0)}%)`);
      
      if (top.percentage > 40) {
        tips.push(`💡 Tip: Coba kurangi pengeluaran ${top.category} karena sudah lebih dari 40% total pengeluaran.`);
      }
    }

    // Balance check
    if (totalBalance < 0) {
      tips.push('🚨 Saldo negatif! Segera evaluasi pengeluaran dan cari sumber pemasukan tambahan.');
    } else if (totalBalance > 0 && totalIncome > 0) {
      const savingsRate = (totalBalance / totalIncome) * 100;
      tips.push(`💰 Tingkat tabungan: ${savingsRate.toFixed(0)}% dari total pemasukan.`);
    }

    // General tips
    tips.push('📝 Tip: Catat semua pengeluaran kecil, karena sering kali pengeluaran kecil yang menumpuk.');

    setAnalysis(tips.join('\n\n'));
    setLoading(false);
  };

  // Auto-generate analysis when modal opens
  useEffect(() => {
    if (isOpen && transactions.length > 0 && !analysis) {
      generateAIAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categoryColors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold">Analisa Keuangan AI</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300">Pemasukan</span>
              </div>
              <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span className="text-xs text-rose-700 dark:text-rose-300">Pengeluaran</span>
              </div>
              <p className="font-bold text-rose-700 dark:text-rose-300">{formatCurrency(totalExpense)}</p>
            </div>
          </div>

          {/* Expense Breakdown */}
          {expenseByCategory.length > 0 && (
            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                <h4 className="font-semibold text-gray-800 dark:text-white text-sm">Pengeluaran per Kategori</h4>
              </div>
              <div className="space-y-2">
                {expenseByCategory.slice(0, 5).map((cat, idx) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${categoryColors[idx % categoryColors.length]}`}></div>
                    <span className="text-xs text-gray-600 dark:text-slate-300 flex-1 truncate">{cat.category}</span>
                    <span className="text-xs font-medium text-gray-800 dark:text-white">{formatCurrency(cat.amount)}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 w-12 text-right">{cat.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              
              {/* Progress bars */}
              <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-600">
                {expenseByCategory.slice(0, 5).map((cat, idx) => (
                  <div 
                    key={cat.category}
                    className={`${categoryColors[idx % categoryColors.length]}`}
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Rekomendasi AI</h4>
              </div>
              <button 
                onClick={generateAIAnalysis}
                disabled={loading}
                className="text-emerald-600 hover:text-emerald-700 p-1"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="ml-2 text-sm text-emerald-700 dark:text-emerald-300">Menganalisa...</span>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Belum ada transaksi untuk dianalisa. Mulai catat pengeluaran dan pemasukanmu! 📝
              </p>
            ) : (
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {analysis}
              </p>
            )}
          </div>

          {/* Income Breakdown */}
          {incomeByCategory.length > 0 && (
            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-gray-800 dark:text-white text-sm">Sumber Pemasukan</h4>
              </div>
              <div className="space-y-2">
                {incomeByCategory.slice(0, 3).map((cat, idx) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-300 flex-1 truncate">{cat.category}</span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
