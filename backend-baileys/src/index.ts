import express from 'express';
import cors from 'cors';
import { initWhatsApp, getQRCode, isConnected } from './whatsapp';
import { initDatabase } from './database';
import { authRoutes } from './routes/auth';
import { transactionRoutes } from './routes/transactions';
import { userRoutes } from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    whatsapp: isConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// QR Code endpoint
app.get('/qr', (req, res) => {
  const qr = getQRCode();
  if (qr) {
    res.json({ qr, status: 'waiting_scan' });
  } else if (isConnected()) {
    res.json({ qr: null, status: 'connected' });
  } else {
    res.json({ qr: null, status: 'initializing' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);

async function main() {
  console.log('🚀 Starting Catat Uang Bot...');
  
  // Initialize database
  initDatabase();
  console.log('✅ Database initialized');
  
  // Initialize WhatsApp
  await initWhatsApp();
  
  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📱 Check /qr endpoint for QR code`);
  });
}

main().catch(console.error);
