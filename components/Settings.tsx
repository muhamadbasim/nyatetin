import React, { useState } from 'react';
import { Settings as SettingsIcon, Trash2, HelpCircle, Bell, Moon, Sun, LogOut, Key, User, MessageCircle } from 'lucide-react';
import { apiService, LoginResponse } from '../services/apiService';

interface SettingsProps {
    onClearData: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onLogout?: () => void;
    user?: LoginResponse | null;
}

export const Settings: React.FC<SettingsProps> = ({ onClearData, isDarkMode, toggleDarkMode, onLogout, user }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordError('Semua field harus diisi');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    
    try {
      await apiService.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Gagal mengubah password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 space-y-6">
       <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Pengaturan</h1>
       
       {/* User Info */}
       {user && (
         <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
           <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
               <User className="w-6 h-6 text-white" />
             </div>
             <div>
               <p className="font-semibold text-emerald-800 dark:text-emerald-200">{user.username}</p>
               <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                 <MessageCircle className="w-3 h-3" /> WhatsApp Connected
               </p>
             </div>
           </div>
         </div>
       )}

       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
            {/* Dark Mode Toggle */}
            <div 
                className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition"
                onClick={toggleDarkMode}
            >
                <div className="flex items-center gap-3">
                    {isDarkMode ? (
                        <Moon size={20} className="text-purple-500" />
                    ) : (
                        <Sun size={20} className="text-orange-500" />
                    )}
                    <span className="text-gray-700 dark:text-slate-200">Mode Gelap</span>
                </div>
                
                {/* Switch UI */}
                <div className={`w-11 h-6 rounded-full flex items-center transition-colors p-1 ${isDarkMode ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
            </div>

            {/* Change Password */}
            <div 
                onClick={() => setShowPasswordModal(true)}
                className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition"
            >
                <Key size={20} className="text-gray-500 dark:text-slate-400" />
                <span className="text-gray-700 dark:text-slate-200">Ubah Password</span>
            </div>

            <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                <Bell size={20} className="text-gray-500 dark:text-slate-400" />
                <span className="text-gray-700 dark:text-slate-200">Notifikasi Harian</span>
            </div>
             <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                <HelpCircle size={20} className="text-gray-500 dark:text-slate-400" />
                <span className="text-gray-700 dark:text-slate-200">Bantuan & Support</span>
            </div>
             <div 
                onClick={() => {
                    if(confirm("Hapus semua data?")) onClearData();
                }}
                className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer transition text-rose-600 dark:text-rose-400"
            >
                <Trash2 size={20} />
                <span>Reset Semua Data</span>
            </div>

            {/* Logout */}
            {onLogout && (
              <div 
                  onClick={onLogout}
                  className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition text-gray-700 dark:text-slate-200"
              >
                  <LogOut size={20} className="text-gray-500 dark:text-slate-400" />
                  <span>Keluar</span>
              </div>
            )}
       </div>

       <div className="text-center text-xs text-gray-400 dark:text-slate-600 mt-10">
            <p>Catat Uang AI v1.0.0</p>
            <p>Made with ❤️ & Gemini</p>
       </div>

       {/* Password Change Modal */}
       {showPasswordModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm">
             <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Ubah Password</h2>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Password Saat Ini</label>
                 <input
                   type="password"
                   value={currentPassword}
                   onChange={(e) => setCurrentPassword(e.target.value)}
                   className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                 />
               </div>
               <div>
                 <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Password Baru</label>
                 <input
                   type="password"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                 />
               </div>
               
               {passwordError && (
                 <p className="text-red-500 text-sm">{passwordError}</p>
               )}
               {passwordSuccess && (
                 <p className="text-green-500 text-sm">{passwordSuccess}</p>
               )}
               
               <div className="flex gap-3">
                 <button
                   onClick={() => {
                     setShowPasswordModal(false);
                     setPasswordError('');
                     setCurrentPassword('');
                     setNewPassword('');
                   }}
                   className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300"
                 >
                   Batal
                 </button>
                 <button
                   onClick={handleChangePassword}
                   disabled={isChangingPassword}
                   className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                 >
                   {isChangingPassword ? 'Menyimpan...' : 'Simpan'}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};
