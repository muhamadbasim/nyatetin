import { proto } from '@whiskeysockets/baileys';
import { sendMessage, markAsRead, sendTyping, stopTyping, getPhoneFromLid, getContacts } from './whatsapp';
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
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('62')) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('0')) {
    return digits;
  }
  return '0' + digits;
}

// Normalize phone number to 62xxx format
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (!digits.startsWith('62') && digits.length >= 10) {
    return '62' + digits;
  }
  return digits;
}

export async function handleIncomingMessage(msg: proto.IWebMessageInfo): Promise<void> {
  if (!msg.key) return;
  
  const from = msg.key.remoteJid;
  if (!from || from.includes('@g.us')) return;
  
  const pushName = msg.pushName || 'User';
  
  // Debug: Log full message structure
  console.log('\n========== NEW MESSAGE ==========');
  console.log('📩 Full JID:', from);
  console.log('👤 Push Name:', pushName);
  console.log('🔑 Key:', JSON.stringify(msg.key, null, 2));
  
  let phoneNumber = '';
  let displayUsername = '';
  
  // Check if LID format
  if (from.includes('@lid')) {
    console.log('⚠️ LID format detected');
    
    // Try multiple methods to get real phone number
    
    // Method 1: Check participant field
    if (msg.key.participant) {
      const participant = msg.key.participant.split('@')[0];
      console.log('📱 Participant:', participant);
      if (!participant.includes('lid') && participant.length >= 10) {
        phoneNumber = normalizePhone(participant);
        console.log('✅ Got phone from participant:', phoneNumber);
      }
    }
    
    // Method 2: Try to get from contacts store
    if (!phoneNumber) {
      const contacts = getContacts();
      const contact = contacts?.[from];
      console.log('📇 Contact info:', JSON.stringify(contact, null, 2));
      
      if (contact?.phone) {
        phoneNumber = normalizePhone(contact.phone);
        console.log('✅ Got phone from contacts:', phoneNumber);
      }
    }
    
    // Method 3: Try getPhoneFromLid function
    if (!phoneNumber) {
      const lidPhone = await getPhoneFromLid(from);
      if (lidPhone) {
        phoneNumber = normalizePhone(lidPhone);
        console.log('✅ Got phone from LID lookup:', phoneNumber);
      }
    }
    
    // Method 4: Check verifiedBizName or other fields
    if (!phoneNumber && msg.verifiedBizName) {
      console.log('🏢 Verified Biz Name:', msg.verifiedBizName);
    }
    
    // Fallback: Use LID as identifier but with pushName as username
    if (!phoneNumber) {
      phoneNumber = from.split('@')[0]; // Use LID as unique ID
      console.log('⚠️ Fallback to LID as ID:', phoneNumber);
    }
    
    // For display, prefer phone number format, fallback to pushName
    if (phoneNumber.length >= 10 && !phoneNumber.includes('lid') && phoneNumber.match(/^\d+$/)) {
      displayUsername = toLocalFormat(phoneNumber);
    } else {
      // Use pushName or generate friendly username
      displayUsername = pushName !== 'User' ? pushName : `user_${phoneNumber.slice(-6)}`;
    }
    
  } else {
    // Standard @s.whatsapp.net format - contains real phone
    phoneNumber = from.replace('@s.whatsapp.net', '').replace('@c.us', '');
    phoneNumber = normalizePhone(phoneNumber);
    displayUsername = toLocalFormat(phoneNumber);
    console.log('✅ Standard format, phone:', phoneNumber);
  }
  
  const text = msg.message?.conversation || 
               msg.message?.extendedTextMessage?.text || '';
  
  if (!text) return;
  
  console.log('📱 Final Phone:', phoneNumber);
  console.log('👤 Display Username:', displayUsername);
  console.log('💬 Text:', text);
  console.log('=================================\n');
  
  await markAsRead(msg.key);
  await sendTyping(from);
  
  try {
    let user = db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber) as any;
    
    if (!user) {
      const id = uuidv4();
      const password = generateRandomPassword();
      const passwordHash = hashPassword(password);
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO users (id, phone_number, username, password_hash, initial_balance, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(id, phoneNumber, displayUsername, passwordHash, now);
      
      await syncUserToD1({
        id,
        phoneNumber,
        username: displayUsername,
        passwordHash,
        initialBalance: 0,
      });
      
      const welcomeMsg = `🎉 *Selamat datang di Nyatetin!*

Akun kamu sudah dibuat otomatis.

📱 *Login Dashboard:*
${DASHBOARD_URL}

👤 Username: \`${displayUsername}\`
🔑 Password: \`${password}\`

Ketik *bantuan* untuk melihat cara pakai.`;
      
      await sendReply(from, welcomeMsg);
      return;
    }
    
    const result = parseMessage(text);
    
    if (!result.success) {
      await sendReply(from, result.error || 'Format tidak dikenali. Ketik *bantuan* untuk panduan.');
      return;
    }
    
    switch (result.command) {
      case 'reset':
        const newPassword = generateRandomPassword();
        const newPasswordHash = hashPassword(newPassword);
        const existingUsername = user.username || displayUsername;
        
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
          .run(newPasswordHash, user.id);
        
        await syncUserToD1({
          id: user.id,
          phoneNumber,
          username: existingUsername,
          passwordHash: newPasswordHash,
          initialBalance: user.initial_balance || 0,
        });
        
        const resetMsg = `🔄 *Password berhasil di-reset!*

📱 *Login Dashboard:*
${DASHBOARD_URL}

👤 Username: \`${existingUsername}\`
🔑 Password baru: \`${newPassword}\`

Data transaksi kamu tetap aman.`;
        
        await sendReply(from, resetMsg);
        return;
        
      case 'help':
        await sendReply(from, getHelpMessage());
        break;
        
      case 'get_balance':
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

async function sendReply(to: string, text: string): Promise<void> {
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
