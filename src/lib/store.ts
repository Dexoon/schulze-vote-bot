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


  try {
    db.transaction(tx => {
      tx.insert(electionsTable).values({ id, chatId: chat.id, question }).run();
      for (const opt of options) {
        tx
          .insert(optionsTable)
          .values({ id: crypto.randomUUID(), electionsId: id, option: opt })
          .run();
      }
    });
  } catch (err) {
    console.error('failed to create vote', err);
    throw err;
  }
 * @returns The created {@link Vote} object with an empty ballots array.
 *
 * @throws {Error} If the chat with the given {@link chatId} does not exist.
 */
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

/**
 * Adds a ballot to the specified vote.
 *
 * @param voteId - The unique identifier of the vote (election) to which the ballot should be added.
 * @param ballot - The ballot containing voter rankings to be recorded.
 * @returns `true` if the ballot was successfully added; `false` if the vote does not exist.
 */
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

/**
 * Retrieves all votes associated with a given chat.
 *
 * @param chatId - The external identifier of the chat whose votes are to be listed.
 * @returns An array of {@link Vote} objects for the specified chat, or an empty array if the chat does not exist.
 */
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

/**
 * Computes the election results for a given vote using the Schulze method.
 *
 * Retrieves all ballots associated with the specified vote, parses their rankings, and returns the computed results. Returns `null` if no ballots are found for the vote.
 *
 * @param voteId - The unique identifier of the vote.
 * @returns The results of the election as computed by the Schulze method, or `null` if there are no ballots.
 */
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
