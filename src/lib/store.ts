import { Ballot, schulze } from './schulze';
import crypto from 'crypto';
import db, { elections as electionsTable, options as optionsTable, ballots as ballotsTable, chats } from './db';
import { eq } from 'drizzle-orm';

export type Vote = {
  id: string;
  chatId: string;
  question: string;
  options: string[];
  ballots: Ballot[];
};


export function createVote(
  chatId: string,
  question: string,
  options: string[]
): Vote {
  const id = crypto.randomUUID();
  const chat = db
    .select()
    .from(chats)
    .where(eq(chats.chatId, chatId))
    .get();
  if (!chat) throw new Error('chat not found');
  db.transaction(tx => {
    tx.insert(electionsTable).values({ id, chatId: chat.id, question }).run();
    for (const opt of options) {
      tx.insert(optionsTable).values({ electionsId: id, option: opt }).run();
    }
  });
  return { id, chatId, question, options, ballots: [] };
}

export function addBallot(voteId: string, ballot: Ballot): boolean {
  const row = db
    .select()
    .from(electionsTable)
    .where(eq(electionsTable.id, voteId))
    .get();
  if (!row) return false;
  db.insert(ballotsTable)
    .values({ id: ballot.id, electionsId: voteId, rankings: JSON.stringify(ballot.rankings) })
    .run();
  return true;
}

export function listVotes(chatId: string): Vote[] {
  const chat = db
    .select()
    .from(chats)
    .where(eq(chats.chatId, chatId))
    .get();
  if (!chat) return [];
  const rows = db
    .select()
    .from(electionsTable)
    .where(eq(electionsTable.chatId, chat.id))
    .all();
  return rows.map(r => {
    const opts = db
      .select({ option: optionsTable.option })
      .from(optionsTable)
      .where(eq(optionsTable.electionsId, r.id))
      .all()
      .map(o => o.option as string);
    const ballots = db
      .select()
      .from(ballotsTable)
      .where(eq(ballotsTable.electionsId, r.id))
      .all()
      .map(b => ({ id: b.id, rankings: JSON.parse(b.rankings) }));
    return { id: r.id, chatId, question: r.question, options: opts, ballots };
  });
}

export function getResults(voteId: string) {
  const rows = db
    .select()
    .from(ballotsTable)
    .where(eq(ballotsTable.electionsId, voteId))
    .all() as { id: string; rankings: string }[];
  if (rows.length === 0) return null;
  const ballots = rows.map(r => ({ id: r.id, rankings: JSON.parse(r.rankings) as string[][] }));
  return schulze(ballots);
}
