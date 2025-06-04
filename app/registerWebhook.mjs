import { Telegraf } from 'telegraf';
import crypto from 'crypto';

const token = process.env.BOT_TOKEN;
const base = process.env.BASE_URL;
const secret = process.env.WEBHOOK_SECRET;

if (!token || !base || !secret) {
  console.error('BOT_TOKEN, BASE_URL, and WEBHOOK_SECRET must be set');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
const path = `api/webhook/${hash}`;
const url = `${base.replace(/\/$/, '')}/${path}`;

const bot = new Telegraf(token);
try {
  await bot.telegram.setWebhook(url, { secret_token: secret });
  console.log('Webhook registered', url);
} catch (err) {
  console.error('Failed to set webhook', err);
  process.exit(1);
}

