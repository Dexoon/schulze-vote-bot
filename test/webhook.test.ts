import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

const SECRET = 'sec';
const TOKEN = '123:ABC';
const BASE = 'https://example.com';

test('start message sends login link', async () => {
  const prevSecret = process.env.WEBHOOK_SECRET;
  const prevToken = process.env.BOT_TOKEN;
  const prevBase = process.env.BASE_URL;
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

  const body = { update_id: 1, message: { chat: { id: 42 } } };
  const req = new NextRequest('http://localhost/api/webhook/' + mainId, {
    method: 'POST',
    headers: { 'x-telegram-bot-api-secret-token': SECRET },
    body: JSON.stringify(body),
    duplex: 'half'
  });

  const res = await POST(req, { params: { id: mainId } });

  assert.equal(res.status, 200);
  assert.equal(sendMessage.mock.calls.length, 1);
  assert.deepEqual(sendMessage.mock.calls[0].arguments[0], 42);
  assert.deepEqual(sendMessage.mock.calls[0].arguments[1], 'Use this link to log in:');

  process.env.WEBHOOK_SECRET = prevSecret;
  process.env.BOT_TOKEN = prevToken;
  process.env.BASE_URL = prevBase;
});

