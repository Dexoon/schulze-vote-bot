import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db.ts',
  out: './drizzle',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: process.env.DB_PATH || './data.db',
  },
} satisfies Config;
