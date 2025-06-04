import { vi } from 'vitest';

// Set test environment
vi.stubEnv('NODE_ENV', 'test');

// Mock environment variables
vi.stubEnv('BOT_TOKEN', '123:MAINTOKEN');
vi.stubEnv('API_KEY', 'apikey');
vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.com');
vi.stubEnv('WEBHOOK_SECRET', 'whsec');

// Mock fetch
global.fetch = vi.fn();

// Mock crypto
vi.stubGlobal('crypto', {
  createHash: () => ({
    update: () => ({
      digest: () => '0123456789abcdef',
    }),
  }),
}); 