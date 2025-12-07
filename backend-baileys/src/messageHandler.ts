import { proto } from '@whiskeysockets/baileys';
import { sendMessage, markAsRead, sendTyping, stopTyping } from './whatsapp';
import { parseMessage } from './parser';
import { db } from './database';
import { hashPassword, generateRandomPassword } from './utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { syncUserToD1, syncTransactionToD1, syncBalanceToD1 } from './cloudflareSync';

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://nyatetin.pages.dev';
const WORKERS_API_URL = process.env.WORKERS_API_URL || 'https://catat-uang-api.muhamadbasim.workers.dev/api';

console.log('🔧 Config:', { DASHBOARD_URL, WORKERS_API_URL });

// Convert international format (628xxx) to local format (08xxx)
function toLocalFormat(phone: string): string {
  if (phone.startsWith('62')) {
    return '0' + phone.slice(2);
  }
  return phone;
}

export async function handleIncomingMessage(msg: proto.IWebMessageInfo): Promise<void> {
  if (!msg.key) return;
  
  const from = msg.key.remoteJid;
  if (!from || from.includes('@g.us')) return; // Ignore group messages
  
  const phoneNumber = from.replace('@s.whatsapp.net', '');
  const localPhone = toLocalFormat(phoneNumber);
  const text = msg.message?.conversation || 
               msg.message?.extendedTextMessage?.text || '';
  
  if (!text) return;
  
  console.log(`📩 Message from ${phoneNumber}: ${text}`);
  
  // Mark message as read (blue checkmark)
  await markAsRead(msg.key);
  
  // Show typing indicator
  await sendTyping(from);
  
  try {
    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber) as any;
    
    // Create new user if not exists
    if (!user) {
      const id = uuidv4();
      const password = generateRandomPassword();
      const passwordHash = hashPassword(password);
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO users (id, phone_number, username, password_hash, initial_balance, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(id, phoneNumber, localPhone, passwordHash, now);
      
      // Sync to Cloudflare D1
      await syncUserToD1({
        id,
        phoneNumber,
        username: localPhone,
        passwordHash,
        initialBalance: 0,
      });
      
      const welcomeMsg = `🎉 *Selamat datang di Nyatetin!*

Akun kamu sudah dibuat otomatis.

📱 *Login Dashboard:*
${DASHBOARD_URL}

👤 Username: \`${localPhone}\`
🔑 Password: \`${password}\`

Ketik *bantuan* untuk melihat cara pakai.`;
      
      await sendReply(from, welcomeMsg);
      return;
    }
    
    // Parse message
    const result = parseMessage(text);
    
    if (!result.success) {
      await sendReply(from, result.error || 'Format tidak dikenali. Ketik *bantuan* untuk panduan.');
      return;
    }
    
    switch (result.command) {
      case 'reset':
        // Reset password only, keep account and transactions
        const newPassword = generateRandomPassword();
        const newPasswordHash = hashPassword(newPassword);
        
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
          .run(newPasswordHash, user.id);
        
        // Sync new password to D1
        await syncUserToD1({
          id: user.id,
          phoneNumber,
          username: localPhone,
          passwordHash: newPasswordHash,
          initialBalance: user.initial_balance || 0,
        });
        
        const resetMsg = `🔄 *Password berhasil di-reset!*

📱 *Login Dashboard:*
${DASHBOARD_URL}

👤 Username: \`${localPhone}\`
🔑 Password baru: \`${newPassword}\`

Data transaksi kamu tetap aman.`;
        
        await sendReply(from, resetMsg);
        return;
        
      case 'help':
        await sendReply(from, getHelpMessage());
        break;
        
      case 'get_balance':
        // Calculate total balance from transactions
        const initialBalance = user.initial_balance || 0;
        const incomeResult = db.prepare(
          "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income'"
        ).get(user.id) as any;
        const expenseResult = db.prepare(
          "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense'"
        ).get(user.id) as any;
        
        const totalIncome = incomeResult?.total || 0;
        const totalExpense = expenseResult?.total || 0;
        const totalBalance = initialBalance + totalIncome - totalExpense;
        
        await sendReply(from, `💰 *Saldo saat ini:* Rp ${formatNumber(totalBalance)}

📊 *Ringkasan:*
• Saldo awal: Rp ${formatNumber(initialBalance)}
• Total pemasukan: Rp ${formatNumber(totalIncome)}
• Total pengeluaran: Rp ${formatNumber(totalExpense)}`);
        break;
        
      case 'set_balance':
        db.prepare('UPDATE users SET initial_balance = ? WHERE id = ?')
          .run(result.data!.amount, user.id);
        // Sync to D1
        await syncBalanceToD1(user.id, result.data!.amount);
        await sendReply(from, `✅ Saldo awal diubah menjadi Rp ${formatNumber(result.data!.amount)}`);
        break;
        
      case 'income':
      case 'expense':
        const txId = uuidv4();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount, description, category, source, created_at)
          VALUES (?, ?, ?, ?, ?, 'Lainnya', 'whatsapp', ?)
        `).run(txId, user.id, result.data!.type, result.data!.amount, result.data!.description, now);
        
        // Sync to D1
        await syncTransactionToD1({
          id: txId,
          userId: user.id,
          type: result.data!.type as 'income' | 'expense',
          amount: result.data!.amount,
          description: result.data!.description || '',
          category: 'Lainnya',
          source: 'whatsapp',
        });
        
        const emoji = result.data!.type === 'income' ? '💵' : '💸';
        const typeText = result.data!.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        await sendReply(from, `${emoji} *${typeText} tercatat!*

💰 Rp ${formatNumber(result.data!.amount)}
📝 ${result.data!.description}`);
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await sendReply(from, '❌ Terjadi kesalahan. Coba lagi nanti.');
  }
}

// Helper to send message with typing delay
async function sendReply(to: string, text: string): Promise<void> {
  // Small delay to simulate typing (makes it feel more natural)
  await new Promise(resolve => setTimeout(resolve, 500));
  await stopTyping(to);
  await sendMessage(to, text);
}

function getHelpMessage(): string {
  return `📖 *Panduan Nyatetin*

*Catat Pengeluaran:*
\`50rb makan\` ← langsung tulis
\`keluar 25rb kopi\`
\`bayar 1.5jt listrik\`

*Catat Pemasukan:*
\`masuk 5jt gaji\`
\`terima 500rb freelance\`
\`+ 100rb cashback\`

*Cek & Set Saldo:*
\`saldo\` - cek saldo
\`saldo awal 1jt\` - set saldo awal

*Lainnya:*
\`bantuan\` - panduan ini
\`reset\` - reset password

💡 Singkatan: rb/ribu, jt/juta, k`;
}

function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}
