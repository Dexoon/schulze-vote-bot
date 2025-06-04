import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { loginSecret } from '../src/lib/loginSecret';

const MAIN_TOKEN = '123:MAINTOKEN';
const API_KEY = 'apikey';
const BASE = 'https://example.com';
const WEBHOOK_SECRET = 'whsec';

let verifyPost: any;
let registerPost: any;
let botPost: any;
let getChatMock: any;
let setWebhookMock: any;

function mockEnv() {
  process.env.BOT_TOKEN = MAIN_TOKEN;
  process.env.API_KEY = API_KEY;
  process.env.NEXT_PUBLIC_BASE_URL = BASE;
  process.env.WEBHOOK_SECRET = WEBHOOK_SECRET;
}

describe('login and bot registration flow', () => {
  const env: Record<string, string | undefined> = {};
  let originalTelegraf: any;
  let originalFetch: any;

  beforeEach(async () => {
    env.BOT_TOKEN = process.env.BOT_TOKEN;
    env.API_KEY = process.env.API_KEY;
    env.NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
    env.WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    mockEnv();

    getChatMock = vi.fn(async (id: number) => ({ id, first_name: 'Alice' }));
    setWebhookMock = vi.fn(async () => undefined);

    // Patch global Telegraf for the duration of the test
    originalTelegraf = (globalThis as any).Telegraf;
    class MockTelegraf {
      token: string;
      telegram: any;
      constructor(token: string) {
        this.token = token;
        this.telegram = { getChat: getChatMock, setWebhook: setWebhookMock };
      }
    }
    (globalThis as any).Telegraf = MockTelegraf;

    // Patch global fetch for the duration of the test
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: any, init: any) => {
      const req = new NextRequest(String(input), {
        method: init?.method,
        headers: init?.headers,
        body: init?.body,
        duplex: 'half',
      });
      return botPost(req);
    };

    verifyPost = (await import('../src/app/api/auth/verify/route')).POST;
    botPost = (await import('../src/app/api/bot/route')).POST;
    registerPost = (await import('../src/app/api/bot/register/route')).POST;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original Telegraf
    if (originalTelegraf) {
      (globalThis as any).Telegraf = originalTelegraf;
    }
    // Restore original fetch
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
    process.env.BOT_TOKEN = env.BOT_TOKEN;
    process.env.API_KEY = env.API_KEY;
    process.env.NEXT_PUBLIC_BASE_URL = env.NEXT_PUBLIC_BASE_URL;
    process.env.WEBHOOK_SECRET = env.WEBHOOK_SECRET;
  });

  it('logs in and registers a bot', async () => {
    const userId = 42;
    const secret = loginSecret(MAIN_TOKEN, userId);

    const loginReq = new NextRequest('http://localhost/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, userId }),
      duplex: 'half',
    });

    const loginRes = await verifyPost(loginReq);
    expect(loginRes.status).toBe(200);
    const setCookieHeader = loginRes.headers.get('set-cookie');
    expect(setCookieHeader).toBeTruthy();

    // Parse set-cookie header(s) to construct a valid cookie header
    // Handles multiple cookies in a single header separated by comma, or multiple set-cookie headers
    function extractCookies(setCookie: string): string {
      // Split on comma only if followed by a space and a word character (start of next cookie)
      const parts = setCookie.split(/, (?=\w+=)/);
      return parts.map(part => part.split(';')[0]).join('; ');
    }
    const cookieHeader = extractCookies(setCookieHeader as string);

    const botToken = '999:BOT_TOKEN_______________________________';
    const registerReq = new NextRequest('http://localhost/api/bot/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({ token: botToken }),
      duplex: 'half',
    });

    const regRes = await registerPost(registerReq);
    expect(regRes.status).toBe(200);
    const data = await regRes.json();
    const expectedPath =
      'api/webhook/' +
      crypto.createHash('sha256').update(botToken).digest('hex').slice(0, 16);
    expect(data.path).toBe(expectedPath);
    expect(setWebhookMock).toHaveBeenCalledWith(
      `${BASE}/${expectedPath}`,
      { secret_token: WEBHOOK_SECRET }
    );
    expect(getChatMock).toHaveBeenCalledWith(userId);
  });
});
