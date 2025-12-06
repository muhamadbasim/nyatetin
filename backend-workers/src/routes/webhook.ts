import { Hono } from 'hono';
import { Env } from '../index';
import { parseMessage } from '../utils/parser';
import { hashPassword, generateRandomPassword } from '../utils/auth';
import { buildResponse } from '../utils/response';

export const webhookRoutes = new Hono<{ Bindings: Env }>();

// Webhook verification
webhookRoutes.get('/', (c) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === c.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return c.text(challenge || '');
  }
  return c.text('Forbidden', 403);
});

// Receive messages
webhookRoutes.post('/', async (c) => {
  const payload = await c.req.json();
  console.log('Webhook received:', JSON.stringify(payload));

  // Process asynchronously, respond immediately
  c.executionCtx.waitUntil(processWebhook(payload, c.env));

  return c.text('OK', 200);
});

async function processWebhook(payload: any, env: Env) {
  try {
    if (payload.object !== 'whatsapp_business_account') {
      console.log('Not a WhatsApp message, ignoring');
      return;
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages;
        if (!messages) {
          console.log('No messages in change');
          continue;
        }

        for (const message of messages) {
          console.log('Processing message from:', message.from);
          const response = await handleMessage(message, env);
          console.log('Response to send:', response);
          await sendWhatsAppMessage(message.from, response, env);
        }
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
}

async function handleMessage(message: any, env: Env): Promise<string> {
  const phoneNumber = message.from;
  console.log('Handling message for phone:', phoneNumber);

  try {
    // Check if user exists
    let user = await env.DB.prepare(
      'SELECT * FROM users WHERE phone_number = ?'
    ).bind(phoneNumber).first();

    console.log('User found:', user ? 'yes' : 'no');

    // Create new user if not exists
    if (!user) {
      const id = crypto.randomUUID();
      const password = generateRandomPassword();
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      console.log('Creating new user with id:', id);

      await env.DB.prepare(
        `INSERT INTO users (id, phone_number, username, password_hash, initial_balance, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`
      ).bind(id, phoneNumber, phoneNumber, passwordHash, now).run();

      console.log('User created, sending welcome');
      return buildResponse.welcome(phoneNumber, password, env.DASHBOARD_URL);
    }

    // Handle text messages only
    if (message.type !== 'text' || !message.text?.body) {
      return buildResponse.unknownFormat();
    }

    const parseResult = parseMessage(message.text.body);
    console.log('Parse result:', JSON.stringify(parseResult));

    if (!parseResult.success) {
      return parseResult.error || buildResponse.unknownFormat();
    }

    switch (parseResult.command) {
      case 'help':
        return buildResponse.help();

      case 'get_balance':
        return buildResponse.currentBalance(user.initial_balance as number);

      case 'set_balance':
        await env.DB.prepare(
          'UPDATE users SET initial_balance = ? WHERE id = ?'
        ).bind(parseResult.data!.amount, user.id).run();
        return buildResponse.balanceUpdated(parseResult.data!.amount);

      case 'income':
      case 'expense':
        const txId = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare(
          `INSERT INTO transactions (id, user_id, type, amount, description, category, source, created_at)
           VALUES (?, ?, ?, ?, ?, 'Lainnya', 'whatsapp', ?)`
        ).bind(txId, user.id, parseResult.data!.type, parseResult.data!.amount, parseResult.data!.description, now).run();
        return buildResponse.transactionCreated(
          parseResult.data!.type!,
          parseResult.data!.amount,
          parseResult.data!.description!
        );

      default:
        return buildResponse.unknownFormat();
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return buildResponse.error();
  }
}

async function sendWhatsAppMessage(to: string, text: string, env: Env) {
  console.log('Sending WhatsApp message to:', to);
  console.log('Phone Number ID:', env.WHATSAPP_PHONE_NUMBER_ID);
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    const result = await response.text();
    console.log('WhatsApp API response:', response.status, result);
    
    if (!response.ok) {
      console.error('WhatsApp API error:', result);
    }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
  }
}
