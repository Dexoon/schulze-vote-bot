import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer, unique, primaryKey } from 'drizzle-orm/sqlite-core';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const defaultPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'data.db');
const dbPath = process.env.DB_PATH || defaultPath;

if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);

if (dbPath === ':memory:') {
  migrate(db, { migrationsFolder: './drizzle' });
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  username: text('username'),
});

export const bots = sqliteTable('bots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
});

export const chats = sqliteTable(
  'chats',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    chatId: text('chat_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    botId: integer('bot_id')
      .notNull()
      .references(() => bots.id),
  },
  table => ({
    chats_unique: unique().on(table.chatId, table.userId, table.botId),
  })
);

export const elections = sqliteTable('elections', {
  id: text('id').primaryKey(),
  chatId: integer('chatId')
    .notNull()
    .references(() => chats.id),
  question: text('question').notNull(),
});

export const options = sqliteTable(
  'options',
  {
    id: text('id').primaryKey(),
    electionsId: text('electionsId')
      .notNull()
      .references(() => elections.id),
    option: text('option').notNull(),
  },
  table => ({ pk: unique().on(table.electionsId, table.option) })
);

export const ballots = sqliteTable('ballots', {
  id: text('id').primaryKey(),
  electionsId: text('electionsId')
    .notNull()
    .references(() => elections.id),
  rankings: text('rankings').notNull(),
});

export default db;
