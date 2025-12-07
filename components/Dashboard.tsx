import AnimatedBalance from './AnimatedBalance';
import AnimatedNumber from './AnimatedNumber';
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Sparkles, Lightbulb, RefreshCw, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { SummaryStats, Transaction } from '../types';

interface DashboardProps {
  stats: SummaryStats;
  transactions: Transaction[];
  onOpenAnalysis: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, transactions }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');

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

  // Generate local analysis
  const generateAnalysis = () => {
    setLoading(true);
    
    setTimeout(() => {
      const tips: string[] = [];
      const spendingRatio = stats.totalIncome > 0 ? (stats.totalExpense / stats.totalIncome) * 100 : 0;
      
      if (spendingRatio > 80) {
        tips.push('⚠️ Pengeluaranmu sudah lebih dari 80% pemasukan. Coba kurangi pengeluaran non-esensial.');
      } else if (spendingRatio > 50) {
        tips.push('📊 Pengeluaranmu sekitar ' + spendingRatio.toFixed(0) + '% dari pemasukan. Masih aman, tapi bisa ditingkatkan.');
      } else if (spendingRatio > 0) {
        tips.push('🎉 Bagus! Kamu berhasil menyimpan lebih dari 50% pemasukan.');
      }

      const expenseMap = new Map<string, number>();
      transactions.filter((t: Transaction) => t.type === 'expense').forEach((t: Transaction) => {
        const cat = t.category || t.description || 'Lainnya';
        expenseMap.set(cat, (expenseMap.get(cat) || 0) + t.amount);
      });

      if (expenseMap.size > 0) {
        const sorted = Array.from(expenseMap.entries()).sort((a, b) => b[1] - a[1]);
        const [topCat, topAmount] = sorted[0];
        const topPercentage = stats.totalExpense > 0 ? (topAmount / stats.totalExpense) * 100 : 0;
        tips.push(`💸 Pengeluaran terbesar: ${topCat} (${formatCurrency(topAmount)} - ${topPercentage.toFixed(0)}%)`);
        if (topPercentage > 40) {
          tips.push(`💡 Tip: Coba kurangi pengeluaran ${topCat} karena sudah lebih dari 40% total pengeluaran.`);
        }
      }

      if (stats.totalBalance < 0) {
        tips.push('🚨 Saldo negatif! Segera evaluasi pengeluaran dan cari sumber pemasukan tambahan.');
      } else if (stats.totalBalance > 0 && stats.totalIncome > 0) {
        const savingsRate = ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100;
        tips.push(`💰 Tingkat tabungan: ${savingsRate.toFixed(0)}% dari total pemasukan.`);
      }

      tips.push('📝 Tip: Catat semua pengeluaran kecil, karena sering kali pengeluaran kecil yang menumpuk.');
      setAnalysis(tips.join('\n\n'));
      setLoading(false);
    }, 500);
  };

  const handleAnalysisClick = () => {
    if (!showAnalysis) {
      setShowAnalysis(true);
      if (!analysis) generateAnalysis();
    } else {
      setShowAnalysis(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${15 + i * 15}%`,
                top: `${5 + (i % 3) * 10}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            >
              <span className="text-3xl opacity-20">
                {['💰', '💵', '💳', '📊', '✨', '🎯'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 pt-6 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between text-white mb-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>📝</span> Nyatetin
            </h1>
            <p className="text-sm text-emerald-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {getGreeting()} 👋
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-2xl">😊</span>
          </div>
        </header>

        {/* Quick Stats - Hari Ini */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-500">Masuk Hari Ini</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">
              <AnimatedNumber value={stats.todayIncome} prefix="Rp " className="text-lg font-bold text-emerald-600" />
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-xs text-gray-500">Keluar Hari Ini</span>
            </div>
            <p className="text-lg font-bold text-rose-600">
              <AnimatedNumber value={stats.todayExpense} prefix="Rp " className="text-lg font-bold text-rose-600" />
            </p>
          </div>
        </div>

        {/* AI Analysis Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
            onClick={handleAnalysisClick}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Analisa Keuangan</h4>
                <p className="text-xs text-gray-500">Lihat rekomendasi AI untuk keuanganmu</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-1">
              {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAnalysis ? 'Tutup' : 'Analisa'}
            </button>
          </div>

          {showAnalysis && (
            <div className="border-t border-gray-100 p-4 bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-800 text-sm">Rekomendasi AI</span>
                </div>
                <button 
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); generateAnalysis(); }}
                  disabled={loading}
                  className="text-emerald-600 hover:text-emerald-700 p-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="ml-2 text-sm text-emerald-700">Menganalisa...</span>
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Belum ada transaksi untuk dianalisa. Mulai catat pengeluaran dan pemasukanmu! 📝
                </p>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{analysis}</p>
              )}
            </div>
          )}
        </div>

        {/* Ringkasan Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>📊</span> Ringkasan Keseluruhan
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Saldo Awal</span>
              </div>
              <AnimatedNumber value={stats.initialBalance} prefix="Rp " className="font-medium text-gray-800" />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Total Pemasukan</span>
              </div>
              <AnimatedNumber value={stats.totalIncome} prefix="+Rp " className="font-semibold text-emerald-600" />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Total Pengeluaran</span>
              </div>
              <AnimatedNumber value={stats.totalExpense} prefix="-Rp " className="font-semibold text-rose-600" />
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Transaksi Hari Ini</span>
              </div>
              <span className="font-medium text-gray-800">{stats.todayCount} transaksi</span>
            </div>
          </div>
        </div>

        {/* Saldo Total Card - Di Bawah */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💰</span>
              <span className="text-emerald-100 font-medium">Saldo Total</span>
            </div>
            <AnimatedBalance balance={stats.totalBalance} />
            <p className="text-xs text-emerald-200 mt-2">Kumulatif semua waktu</p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
