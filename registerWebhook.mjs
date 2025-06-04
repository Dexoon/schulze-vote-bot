import { Telegraf } from 'telegraf';
import crypto from 'crypto';
import { URL } from 'url';

const token = process.env.BOT_TOKEN;
const base = process.env.NEXT_PUBLIC_BASE_URL;
const secret = process.env.WEBHOOK_SECRET;

if (!token || !base || !secret) {
  console.error('BOT_TOKEN, NEXT_PUBLIC_BASE_URL, and WEBHOOK_SECRET must be set');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
let urlStr;
try {
  const baseUrl = new URL(base);
  const webhookUrl = new URL(`api/webhook/${hash}`, baseUrl);
  urlStr = webhookUrl.toString();
} catch {
  console.error('NEXT_PUBLIC_BASE_URL must be a valid absolute URL');
  process.exit(1);
}

const bot = new Telegraf(token);
try {
  await bot.telegram.setWebhook(urlStr, { secret_token: secret });
  console.log('Webhook registered', urlStr);
} catch (err) {
  console.error('Failed to set webhook', err);
  process.exit(1);
}

