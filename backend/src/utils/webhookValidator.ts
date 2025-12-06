import crypto from 'crypto';

/**
 * Validate WhatsApp webhook signature
 * Uses HMAC-SHA256 with app secret
 */
export function validateSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature || !appSecret) {
    return false;
  }

  // Signature format: sha256=<hash>
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  const providedHash = signature.replace('sha256=', '');
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedHash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Verify webhook verification token (for initial setup)
 */
export function verifyToken(
  mode: string,
  token: string,
  challenge: string,
  verifyToken: string
): string | null {
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
}
