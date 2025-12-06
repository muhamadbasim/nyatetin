import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { transactionRoutes } from './routes/transactions';
import { userRoutes } from './routes/users';
import { webhookRoutes } from './routes/webhook';

export interface Env {
  DB: D1Database;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_APP_SECRET: string;
  DASHBOARD_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('/*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Debug: Test send WhatsApp message
app.get('/debug/send/:phone', async (c) => {
  const phone = c.req.param('phone');
  const message = 'Test dari Catat Uang Bot! 🎉';
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${c.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    });

    const result = await response.json();
    return c.json({
      success: response.ok,
      status: response.status,
      phoneNumberId: c.env.WHATSAPP_PHONE_NUMBER_ID,
      tokenPreview: c.env.WHATSAPP_ACCESS_TOKEN?.substring(0, 20) + '...',
      result
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Debug: Send template message (more reliable for test numbers)
app.get('/debug/template/:phone', async (c) => {
  const phone = c.req.param('phone');
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${c.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      }),
    });

    const result = await response.json();
    return c.json({
      success: response.ok,
      status: response.status,
      result
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Debug: Reset password for user
app.get('/debug/reset-password/:phone/:newPassword', async (c) => {
  const phone = c.req.param('phone');
  const newPassword = c.req.param('newPassword');
  
  try {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE phone_number = ?'
    ).bind(hash, phone).run();
    
    return c.json({ success: true, message: `Password reset for ${phone}` });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Debug: Check phone number info
app.get('/debug/phone-info', async (c) => {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${c.env.WHATSAPP_PHONE_NUMBER_ID}`, {
      headers: {
        'Authorization': `Bearer ${c.env.WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    const result = await response.json();
    return c.json({
      success: response.ok,
      status: response.status,
      result
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Routes
app.route('/webhook', webhookRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/transactions', transactionRoutes);
app.route('/api/users', userRoutes);

export default app;
