import { IncomingMessage } from '../types/webhook.js';
import { User } from '../types/models.js';
import { parseMessage } from './transactionParser.js';
import * as userService from './userService.js';
import * as transactionService from './transactionService.js';
import { buildResponse } from './responseBuilder.js';
import { ParsedTransaction } from '../types/parser.js';

export interface RouteResult {
  response: string;
  user: User;
}

/**
 * Route incoming WhatsApp message to appropriate handler
 */
export async function routeMessage(message: IncomingMessage): Promise<RouteResult> {
  // Get or create user
  const { user, plainPassword, isNew } = await userService.findOrCreate(message.from);
  
  // If new user, send welcome message
  if (isNew) {
    return {
      response: buildResponse.welcome(user.username, plainPassword),
      user,
    };
  }
  
  // Handle different message types
  if (message.type === 'image') {
    return {
      response: buildResponse.ocrNotSupported(),
      user,
    };
  }
  
  if (message.type !== 'text' || !message.text?.body) {
    return {
      response: buildResponse.unknownFormat(),
      user,
    };
  }
  
  // Parse text message
  const parseResult = parseMessage(message.text.body);
  
  if (!parseResult.success) {
    return {
      response: parseResult.error || buildResponse.unknownFormat(),
      user,
    };
  }
  
  // Handle different commands
  switch (parseResult.command) {
    case 'help':
      return {
        response: buildResponse.help(),
        user,
      };
      
    case 'get_balance':
      const balance = await userService.getInitialBalance(user.id);
      return {
        response: buildResponse.currentBalance(balance),
        user,
      };
      
    case 'set_balance':
      const amount = (parseResult.data as { amount: number }).amount;
      await userService.updateInitialBalance(user.id, amount);
      return {
        response: buildResponse.balanceUpdated(amount),
        user,
      };
      
    case 'income':
    case 'expense':
      const txData = parseResult.data as ParsedTransaction;
      const transaction = await transactionService.createFromWhatsApp(user.id, txData);
      return {
        response: buildResponse.transactionCreated(transaction),
        user,
      };
      
    default:
      return {
        response: buildResponse.unknownFormat(),
        user,
      };
  }
}
