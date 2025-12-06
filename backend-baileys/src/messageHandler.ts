import { proto } from '@whiskeysockets/baileys';
import { sendMessage, markAsRead, sendTyping, stopTyping } from './whatsapp';
import { parseMessage } from './parser';
import { db } from './database';
import { hashPassword, generateRandomPassword } from './utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { syncUserToD1, syncTransactionToD1, syncBalanceToD1 } from './cloudflareSync';

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://catat-uang.pages.dev';

export async function handleIncomingMessage(msg: proto.IWebMessageInfo): Promise<void> {
  const from = msg.key.remoteJid;
  if (!from || from.includes('@g.us')) return; // Ignore group messages
  
  const phoneNumber = from.replace('@s.whatsapp.net', '');
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
      `).run(id, phoneNumber, phoneNumber, passwordHash, now);
      
      // Sync to Cloudflare D1
      await syncUserToD1({
        id,
        phoneNumber,
        username: phoneNumber,
        passwordHash,
        initialBalance: 0,
      });
      
      const welcomeMsg = `🎉 *Selamat datang di Catat Uang!*

Akun kamu sudah dibuat otomatis.

📱 *Login Dashboard:*
${DASHBOARD_URL}

👤 Username: \`${phoneNumber}\`
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
      case 'help':
        await sendReply(from, getHelpMessage());
        break;
        
      case 'get_balance':
        const balance = user.initial_balance || 0;
        await sendReply(from, `💰 *Saldo saat ini:* Rp ${formatNumber(balance)}`);
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
  return `📖 *Panduan Catat Uang*

*Catat Pengeluaran:*
\`- 50000 makan siang\`
\`- 25rb kopi\`
\`- 1.5jt bayar listrik\`

*Catat Pemasukan:*
\`+ 5000000 gaji\`
\`+ 500rb freelance\`

*Cek Saldo:*
\`saldo\`

*Set Saldo Awal:*
\`saldo awal 1000000\`

*Bantuan:*
\`bantuan\` atau \`help\`

💡 *Tips:* Gunakan rb (ribu), jt (juta), atau k untuk singkatan angka.`;
}

function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}
