import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const defaultPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'data.db');
const dbPath = process.env.DB_PATH || defaultPath;

if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
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

export default db;
