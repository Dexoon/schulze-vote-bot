import crypto from 'crypto';

export function loginSecret(botToken: string, userId: string | number): string {
  return crypto.createHash('sha256').update(botToken + String(userId)).digest('hex');
}
