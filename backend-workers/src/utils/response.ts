import { formatRupiah } from './parser';

export const buildResponse = {
  welcome(username: string, password: string, dashboardUrl: string): string {
    return `🎉 Selamat datang di Catat Uang!

Akun kamu sudah dibuat:
📝 Username: ${username}
🔑 Password: ${password}

🌐 Login di: ${dashboardUrl}
⚙️ Jangan lupa ubah password di Settings

📝 Cara catat transaksi:
+ 20000 makan siang
- 15000 bensin

Ketik 'bantuan' untuk panduan lengkap`;
  },

  help(): string {
    return `💻 Panduan Catat Uang

💰 Set Saldo Awal:
• 'saldo awal 1000000'
• 'saldo awal 500rb'

📥 Catat Pemasukan:
• '+ 20000 makan siang'
• '+ 1jt gaji'

📤 Catat Pengeluaran:
• '- 15000 bensin'
• '- 50rb makan'

📊 Cek Saldo:
• 'saldo awal'

💡 Tips: Gunakan 'rb' untuk ribu, 'jt' untuk juta`;
  },

  transactionCreated(type: 'income' | 'expense', amount: number, description: string): string {
    const emoji = type === 'income' ? '📥' : '📤';
    const label = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    return `✅ ${label} tercatat!\n\n${emoji} ${formatRupiah(amount)}\n📝 ${description}`;
  },

  balanceUpdated(amount: number): string {
    return `✅ Saldo awal diperbarui!\n\n💰 Saldo awal: ${formatRupiah(amount)}`;
  },

  currentBalance(amount: number): string {
    return `💰 Saldo awal kamu: ${formatRupiah(amount)}`;
  },

  unknownFormat(): string {
    return `❌ Format tidak dikenali.\n\nKetik 'bantuan' untuk panduan.`;
  },

  error(): string {
    return `❌ Terjadi kesalahan. Silakan coba lagi.`;
  },
};
