import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { loginSecret } from '../src/lib/loginSecret';

const SECRET = 'sec';
const TOKEN = '123:ABC';
const BASE = 'https://example.com';

describe('webhook handler', () => {
  // Save original env vars
  let prevSecret: string | undefined;
  let prevToken: string | undefined;
  let prevBase: string | undefined;
  let mod: any;
  let sendMessage: any;

  beforeEach(async () => {
    // Save original env vars
    prevSecret = process.env.WEBHOOK_SECRET;
    prevToken = process.env.BOT_TOKEN;
    prevBase = process.env.BASE_URL;

    // Setup test environment
    process.env.WEBHOOK_SECRET = SECRET;
    process.env.BOT_TOKEN = TOKEN;
    process.env.BASE_URL = BASE;

    // Import after setting env vars
    mod = await import('../src/app/api/webhook/[id]/route');
    const { __getState, __setTestState } = mod;
    const { loginUrl, mainId } = __getState();

    // Replace bot with stub
    sendMessage = vi.fn();
    const stubBot = { telegram: { sendMessage } };
    __setTestState(stubBot, mainId, loginUrl);
  });

  afterEach(() => {
    // Cleanup
    process.env.WEBHOOK_SECRET = prevSecret;
    process.env.BOT_TOKEN = prevToken;
    process.env.BASE_URL = prevBase;
    mod.__setTestState(null, null, null);
  });

  it('start message sends login link', async () => {
    const chatId = 42;
    const body = { update_id: 1, message: { chat: { id: chatId } } };
    const req = new NextRequest('http://localhost/api/webhook/' + mod.__getState().mainId, {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': SECRET },
      body: JSON.stringify(body),
      duplex: 'half'
    });

    const res = await mod.POST(req, { params: { id: mod.__getState().mainId } });

    expect(res.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      chatId,
      'Use this link to log in:',
      {
        reply_markup: {
          inline_keyboard: [[{
            text: 'Log in',
            url: `${mod.__getState().loginUrl}?secret=${loginSecret(TOKEN, chatId)}&chatId=${chatId}`
          }]]
        }
      }
    );
  });

  it('rejects invalid secret token', async () => {
    const body = { update_id: 1, message: { chat: { id: 42 } } };
    const req = new NextRequest('http://localhost/api/webhook/' + mod.__getState().mainId, {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'wrong-secret' },
      body: JSON.stringify(body),
      duplex: 'half'
    });

    const res = await mod.POST(req, { params: { id: mod.__getState().mainId } });
    expect(res.status).toBe(401);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/webhook/' + mod.__getState().mainId, {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': SECRET },
      body: 'invalid json',
      duplex: 'half'
    });

    const res = await mod.POST(req, { params: { id: mod.__getState().mainId } });
    expect(res.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rejects invalid webhook ID', async () => {
    const body = { update_id: 1, message: { chat: { id: 42 } } };
    const req = new NextRequest('http://localhost/api/webhook/wrong-id', {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': SECRET },
      body: JSON.stringify(body),
      duplex: 'half'
    });

    const res = await mod.POST(req, { params: { id: 'wrong-id' } });
    expect(res.status).toBe(200); // Still returns 200 but doesn't send message
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

