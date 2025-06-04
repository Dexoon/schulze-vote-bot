import { Ballot, schulze } from './schulze';
import crypto from 'crypto';
import db from './db';

export type Vote = {
  id: string;
  chatId: string;
  question: string;
  options: string[];
  ballots: Ballot[];
};

const insertVote = db.prepare(
  'INSERT INTO votes (id, chatId, question) VALUES (?, ?, ?)'
);
const insertOption = db.prepare(
  'INSERT INTO options (voteId, option) VALUES (?, ?)'
);
const insertBallot = db.prepare(
  'INSERT INTO ballots (id, voteId, rankings) VALUES (?, ?, ?)'
);
const getVote = db.prepare('SELECT id, chatId, question FROM votes WHERE id=?');
const getOptions = db.prepare('SELECT option FROM options WHERE voteId=?');
const getBallots = db.prepare('SELECT id, rankings FROM ballots WHERE voteId=?');
const listVotesStmt = db.prepare(
  'SELECT id, chatId, question FROM votes WHERE chatId=?'
);

export function createVote(
  chatId: string,
  question: string,
  options: string[]
): Vote {
  const id = crypto.randomUUID();
  insertVote.run(id, chatId, question);
  const insertMany = db.transaction((opts: string[]) => {
    for (const opt of opts) insertOption.run(id, opt);
  });
  insertMany(options);
  return { id, chatId, question, options, ballots: [] };
}

export function addBallot(voteId: string, ballot: Ballot): boolean {
  const row = getVote.get(voteId);
  if (!row) return false;
  insertBallot.run(ballot.id, voteId, JSON.stringify(ballot.rankings));
  return true;
}

export function listVotes(chatId: string): Vote[] {
  const rows = listVotesStmt.all(chatId) as { id: string; chatId: string; question: string }[];
  return rows.map(r => {
    const opts = getOptions.all(r.id).map((o: any) => o.option as string);
    const ballots = getBallots.all(r.id).map((b: any) => ({ id: b.id, rankings: JSON.parse(b.rankings) }));
    return { id: r.id, chatId: r.chatId, question: r.question, options: opts, ballots };
  });
}

export function getResults(voteId: string) {
  const rows = getBallots.all(voteId) as { id: string; rankings: string }[];
  if (rows.length === 0) return null;
  const ballots = rows.map(r => ({ id: r.id, rankings: JSON.parse(r.rankings) as string[][] }));
  return schulze(ballots);
}
