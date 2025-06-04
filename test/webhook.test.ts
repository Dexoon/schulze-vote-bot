import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { loginSecret } from '../src/lib/loginSecret';

const SECRET = 'sec';
const TOKEN = '123:ABC';
const BASE = 'https://example.com';

test('webhook handler', async (t) => {
  // Save original env vars
  const prevSecret = process.env.WEBHOOK_SECRET;
  const prevToken = process.env.BOT_TOKEN;
  const prevBase = process.env.BASE_URL;

  // Setup test environment
  process.env.WEBHOOK_SECRET = SECRET;
  process.env.BOT_TOKEN = TOKEN;
  process.env.BASE_URL = BASE;

  // Import after setting env vars
  const mod = await import('../src/app/api/webhook/[id]/route');
  const { POST, __getState, __setTestState } = mod;
  const { loginUrl, mainId } = __getState();

  // Replace bot with stub
  const sendMessage = mock.fn();
  const stubBot = { telegram: { sendMessage } } as any;
  __setTestState(stubBot, mainId, loginUrl);

  await t.test('start message sends login link', async () => {
    const chatId = 42;
    const body = { update_id: 1, message: { chat: { id: chatId } } };
    const req = new NextRequest('http://localhost/api/webhook/' + mainId, {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': SECRET },
      body: JSON.stringify(body),
      duplex: 'half'
    });

    const res = await POST(req, { params: { id: mainId! } });

    assert.equal(res.status, 200);
    assert.equal(sendMessage.mock.calls.length, 1);
    assert.deepEqual(sendMessage.mock.calls[0].arguments[0], chatId);
    assert.deepEqual(sendMessage.mock.calls[0].arguments[1], 'Use this link to log in:');
    assert.deepEqual(sendMessage.mock.calls[0].arguments[2], {
      reply_markup: {
        inline_keyboard: [[{
          text: 'Log in',
          url: `${loginUrl}?secret=${loginSecret(TOKEN, chatId)}&chatId=${chatId}`
        }]]
      }
    });
  });

  await t.test('rejects invalid secret token', async () => {
    const body = { update_id: 1, message: { chat: { id: 42 } } };
    const req = new NextRequest('http://localhost/api/webhook/' + mainId, {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'wrong-secret' },
      body: JSON.stringify(body),
      duplex: 'half'
    });

    const res = await POST(req, { params: { id: mainId! } });
    assert.equal(res.status, 401);
    assert.equal(sendMessage.mock.calls.length, 0);
  });

  await t.test('rejects invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/webhook/' + mainId, {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': SECRET },
      body: 'invalid json',
      duplex: 'half'
    });

    const res = await POST(req, { params: { id: mainId! } });
    assert.equal(res.status, 400);
    assert.equal(sendMessage.mock.calls.length, 0);
  });

  await t.test('rejects invalid webhook ID', async () => {
    const body = { update_id: 1, message: { chat: { id: 42 } } };
    const req = new NextRequest('http://localhost/api/webhook/wrong-id', {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': SECRET },
      body: JSON.stringify(body),
      duplex: 'half'
    });

    const res = await POST(req, { params: { id: 'wrong-id' } });
    assert.equal(res.status, 200); // Still returns 200 but doesn't send message
    assert.equal(sendMessage.mock.calls.length, 0);
  });

  // Cleanup
  process.env.WEBHOOK_SECRET = prevSecret;
  process.env.BOT_TOKEN = prevToken;
  process.env.BASE_URL = prevBase;
  __setTestState(null, null, null);
});

