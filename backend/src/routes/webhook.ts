import { Router, Request, Response } from 'express';
import { WebhookPayload } from '../types/webhook.js';
import { validateSignature, verifyToken } from '../utils/webhookValidator.js';
import { routeMessage } from '../services/messageRouter.js';
import { sendMessage, markAsRead } from '../services/whatsappClient.js';

export const webhookRouter = Router();

/**
 * GET /webhook - Webhook verification (required by Meta)
 */
webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;
  
  const verifyTokenEnv = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const result = verifyToken(mode, token, challenge, verifyTokenEnv);
  
  if (result) {
    console.log('✅ Webhook verified');
    res.status(200).send(result);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * POST /webhook - Receive incoming messages
 */
webhookRouter.post('/', async (req: Request, res: Response) => {
  // Always respond with 200 quickly to acknowledge receipt
  res.sendStatus(200);
  
  try {
    const payload = req.body as WebhookPayload;
    
    // Validate it's a WhatsApp message
    if (payload.object !== 'whatsapp_business_account') {
      return;
    }
    
    // Process each entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const messages = change.value.messages;
        
        if (!messages || messages.length === 0) {
          continue;
        }
        
        for (const message of messages) {
          // Mark as read
          await markAsRead(message.id);
          
          // Route and process message
          const result = await routeMessage(message);
          
          // Send response
          await sendMessage(message.from, result.response);
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});
