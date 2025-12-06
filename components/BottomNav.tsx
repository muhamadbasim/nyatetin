import React from 'react';
import { Home, List, Settings } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `flex flex-col items-center gap-1 w-full py-3 transition-colors ${
      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400'
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 transition-colors duration-200">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <button className={getTabClass(Tab.HOME)} onClick={() => setActiveTab(Tab.HOME)}>
          <Home size={24} strokeWidth={activeTab === Tab.HOME ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Beranda</span>
        </button>
        <button className={getTabClass(Tab.TRANSACTIONS)} onClick={() => setActiveTab(Tab.TRANSACTIONS)}>
          <List size={24} strokeWidth={activeTab === Tab.TRANSACTIONS ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Transaksi</span>
        </button>
        <button className={getTabClass(Tab.SETTINGS)} onClick={() => setActiveTab(Tab.SETTINGS)}>
          <Settings size={24} strokeWidth={activeTab === Tab.SETTINGS ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Pengaturan</span>
        </button>
      </div>
    </div>
  );
};