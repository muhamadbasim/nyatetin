import { Transaction } from '../types/models.js';
import { formatRupiah } from '../utils/amountParser.js';

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://catat-uang.pages.dev';

export const buildResponse = {
  /**
   * Welcome message for new users
   */
  welcome(username: string, password: string): string {
    return `🎉 Selamat datang di Catat Uang!

Akun kamu sudah dibuat:
📝 Username: ${username}
🔑 Password: ${password}

🌐 Login di: ${DASHBOARD_URL}
⚙️ Jangan lupa ubah password di Settings

📝 Cara catat transaksi:
+ 20000 makan siang
- 15000 bensin
atau kirim foto struk

Ketik 'bantuan' untuk panduan lengkap`;
  },

  /**
   * Help message with all commands
   */
  help(): string {
    return `💻 Panduan Catat Uang

💰 Set Saldo Awal:
• 'saldo awal 1000000' → Set saldo awal 1 juta
• 'saldo awal 500rb' → Set saldo awal 500 ribu

📥 Catat Pemasukan:
• '+ 20000 makan siang'
• '+ 1jt gaji bulanan'
• '+ 500rb freelance'

📤 Catat Pengeluaran:
• '- 15000 bensin'
• '- 50rb makan'
• '- 2jt bayar kos'

📊 Cek Saldo:
• 'saldo awal' → Lihat saldo awal

💡 Tips:
• Gunakan 'rb' untuk ribu (1rb = 1.000)
• Gunakan 'jt' untuk juta (1jt = 1.000.000)
• Kirim foto struk untuk input otomatis`;
  },

  /**
   * Transaction created confirmation
   */
  transactionCreated(transaction: Transaction): string {
    const emoji = transaction.type === 'income' ? '📥' : '📤';
    const label = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    
    return `✅ ${label} tercatat!

${emoji} ${formatRupiah(transaction.amount)}
📝 ${transaction.description}
🕐 ${new Date(transaction.createdAt).toLocaleString('id-ID')}`;
  },

  /**
   * Balance updated confirmation
   */
  balanceUpdated(amount: number): string {
    return `✅ Saldo awal diperbarui!

💰 Saldo awal: ${formatRupiah(amount)}`;
  },

  /**
   * Current balance response
   */
  currentBalance(amount: number): string {
    return `💰 Saldo awal kamu: ${formatRupiah(amount)}`;
  },

  /**
   * Unknown format error
   */
  unknownFormat(): string {
    return `❌ Format tidak dikenali.

Ketik 'bantuan' untuk melihat panduan lengkap.`;
  },

  /**
   * OCR not supported (placeholder)
   */
  ocrNotSupported(): string {
    return `📷 Fitur scan struk belum tersedia.

Silakan input manual:
• '+ 20000 makan siang' untuk pemasukan
• '- 15000 bensin' untuk pengeluaran`;
  },

  /**
   * Generic error message
   */
  error(): string {
    return `❌ Terjadi kesalahan. Silakan coba lagi.`;
  },
};
