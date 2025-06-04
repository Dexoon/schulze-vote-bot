import { Ballot, schulze } from './schulze';
import crypto from 'crypto';
import db, { votes as votesTable, options as optionsTable, ballots as ballotsTable } from './db';
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
  db.transaction(tx => {
    tx.insert(votesTable).values({ id, chatId, question }).run();
    for (const opt of options) {
      tx.insert(optionsTable).values({ voteId: id, option: opt }).run();
    }
  });
  return { id, chatId, question, options, ballots: [] };
}

export function addBallot(voteId: string, ballot: Ballot): boolean {
  const row = db
    .select()
    .from(votesTable)
    .where(eq(votesTable.id, voteId))
    .get();
  if (!row) return false;
  db.insert(ballotsTable)
    .values({ id: ballot.id, voteId, rankings: JSON.stringify(ballot.rankings) })
    .run();
  return true;
}

export function listVotes(chatId: string): Vote[] {
  const rows = db
    .select()
    .from(votesTable)
    .where(eq(votesTable.chatId, chatId))
    .all();
  return rows.map(r => {
    const opts = db
      .select({ option: optionsTable.option })
      .from(optionsTable)
      .where(eq(optionsTable.voteId, r.id))
      .all()
      .map(o => o.option as string);
    const ballots = db
      .select()
      .from(ballotsTable)
      .where(eq(ballotsTable.voteId, r.id))
      .all()
      .map(b => ({ id: b.id, rankings: JSON.parse(b.rankings) }));
    return { id: r.id, chatId: r.chatId, question: r.question, options: opts, ballots };
  });
}

export function getResults(voteId: string) {
  const rows = db
    .select()
    .from(ballotsTable)
    .where(eq(ballotsTable.voteId, voteId))
    .all() as { id: string; rankings: string }[];
  if (rows.length === 0) return null;
  const ballots = rows.map(r => ({ id: r.id, rankings: JSON.parse(r.rankings) as string[][] }));
  return schulze(ballots);
}
