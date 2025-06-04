import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

const defaultPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'data.db');
const dbPath = process.env.DB_PATH || defaultPath;

if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  chatId TEXT NOT NULL,
  question TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS options (
  voteId TEXT NOT NULL,
  option TEXT NOT NULL,
  FOREIGN KEY(voteId) REFERENCES votes(id)
);
CREATE TABLE IF NOT EXISTS ballots (
  id TEXT NOT NULL,
  voteId TEXT NOT NULL,
  rankings TEXT NOT NULL,
  FOREIGN KEY(voteId) REFERENCES votes(id)
);
`);

export const db = drizzle(sqlite);

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey(),
  chatId: text('chatId').notNull(),
  question: text('question').notNull(),
});

export const options = sqliteTable('options', {
  voteId: text('voteId').notNull(),
  option: text('option').notNull(),
});

export const ballots = sqliteTable('ballots', {
  id: text('id').notNull(),
  voteId: text('voteId').notNull(),
  rankings: text('rankings').notNull(),
});

export default db;
