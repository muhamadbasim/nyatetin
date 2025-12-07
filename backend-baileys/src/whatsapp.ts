import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { handleIncomingMessage } from './messageHandler';

let sock: WASocket | null = null;
let currentQR: string | null = null;
let connected = false;

const logger = pino({ level: 'silent' });

// Simple contact store
const contacts: Record<string, any> = {};

export function getQRCode(): string | null {
  return currentQR;
}

export function isConnected(): boolean {
  return connected;
}

export function getSocket(): WASocket | null {
  return sock;
}

export function getContacts() {
  return contacts;
}

export async function sendMessage(to: string, text: string): Promise<void> {
  if (!sock || !connected) {
    console.error('WhatsApp not connected');
    return;
  }
  
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  await sock.sendMessage(jid, { text });
  console.log(`📤 Sent message to ${to}`);
}

// Mark message as read
export async function markAsRead(messageKey: any): Promise<void> {
  if (!sock || !connected) return;
  
  try {
    await sock.readMessages([messageKey]);
    console.log(`✓ Marked as read`);
  } catch (error) {
    console.error('Error marking as read:', error);
  }
}

// Show typing indicator
export async function sendTyping(to: string): Promise<void> {
  if (!sock || !connected) return;
  
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  try {
    await sock.sendPresenceUpdate('composing', jid);
  } catch (error) {
    console.error('Error sending typing:', error);
  }
}

// Stop typing indicator
export async function stopTyping(to: string): Promise<void> {
  if (!sock || !connected) return;
  
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  try {
    await sock.sendPresenceUpdate('paused', jid);
  } catch (error) {
    console.error('Error stopping typing:', error);
  }
}

// Get phone number from LID using onWhatsApp
export async function getPhoneFromLid(lid: string): Promise<string | null> {
  if (!sock) return null;
  
  try {
    // Check contacts store first
    if (contacts[lid]?.phone) {
      return contacts[lid].phone;
    }
    
    // Try to query WhatsApp
    const lidNumber = lid.split('@')[0];
    const results = await sock.onWhatsApp(lidNumber);
    if (results && results.length > 0) {
      const result = results[0];
      if (result?.jid && !result.jid.includes('@lid')) {
        const phone = result.jid.split('@')[0];
        contacts[lid] = { ...contacts[lid], phone };
        return phone;
      }
    }
  } catch (error) {
    console.error('Error getting phone from LID:', error);
  }
  
  return null;
}

export async function initWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();
  
  console.log(`📱 Using WA version: ${version.join('.')}`);
  
  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    browser: ['Nyatetin Bot', 'Chrome', '120.0.0'],
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      currentQR = qr;
      console.log('\n📱 Scan QR Code di bawah ini dengan WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\nAtau buka http://localhost:3001/qr untuk QR code\n');
    }
    
    if (connection === 'close') {
      connected = false;
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      
      console.log(`Connection closed. Reason: ${DisconnectReason[reason] || reason}`);
      
      if (shouldReconnect) {
        console.log('🔄 Reconnecting in 5 seconds...');
        setTimeout(() => initWhatsApp(), 5000);
      } else {
        console.log('❌ Logged out. Hapus folder auth_info dan restart.');
      }
    } else if (connection === 'open') {
      connected = true;
      currentQR = null;
      console.log('✅ WhatsApp connected!');
    }
  });

  // Track contacts updates
  sock.ev.on('contacts.update', (updates) => {
    for (const update of updates) {
      if (update.id) {
        contacts[update.id] = { 
          ...(contacts[update.id] || {}), 
          ...update 
        };
        console.log('📇 Contact updated:', update.id);
      }
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && m.type === 'notify') {
      await handleIncomingMessage(msg);
    }
  });
}
