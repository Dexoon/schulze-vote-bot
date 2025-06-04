import { test, expect } from 'vitest';
import crypto from 'crypto';

import { verifyTelegramAuth } from '../src/lib/verifyTelegram';
import { schulze, Ballot } from '../src/lib/schulze';
import { createVote, addBallot, getResults } from '../src/lib/store';
import db, { users, bots, chats } from '../src/lib/db';
import { loginSecret } from '../src/lib/loginSecret';


test('verifyTelegramAuth valid hash', () => {
  const botToken = '123:ABC';
  const params: Record<string, string> = {
    id: '1',
    first_name: 'Alice',
    auth_date: '123456'
  };
  const data = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('\n');
  const hash = crypto
    .createHmac('sha256', crypto.createHash('sha256').update(botToken).digest())
    .update(data)
    .digest('hex');
  expect(verifyTelegramAuth({ ...params, hash }, botToken)).toBe(true);
});

test('verifyTelegramAuth invalid hash', () => {
  const botToken = '123:ABC';
  const params = {
    id: '1',
    first_name: 'Alice',
    auth_date: '123456',
    hash: 'wrong'
  };
  expect(verifyTelegramAuth(params, botToken)).toBe(false);
});

test('schulze ranking', () => {
  const ballots: Ballot[] = [
    { id: 'b1', rankings: [['A'], ['B'], ['C']] },
    { id: 'b2', rankings: [['A'], ['C'], ['B']] },
    { id: 'b3', rankings: [['B'], ['C'], ['A']] },
  ];
  expect(schulze(ballots)).toEqual(['A', 'B', 'C']);
});

test('store vote lifecycle', () => {
  db.insert(users).values({ id: 'u1', firstName: 'Alice' }).run();
  const botRes = db.insert(bots).values({ token: 'tok', userId: 'u1' }).run();
  const botId = Number(botRes.lastInsertRowid);
  db.insert(chats).values({ chatId: 'chat1', userId: 'u1', botId }).run();

  const vote = createVote('chat1', 'Best letter', ['A', 'B', 'C']);
  const ballot: Ballot = { id: 'u1', rankings: [['A'], ['B'], ['C']] };
  expect(addBallot(vote.id, ballot)).toBe(true);
  expect(getResults(vote.id)).toEqual(['A', 'B', 'C']);
  expect(addBallot('nonexistent', ballot)).toBe(false);
});

test('loginSecret generates user specific secret', () => {
  const token = 'TESTTOKEN';
  const userId = 42;
  const expected = crypto.createHash('sha256').update(token + String(userId)).digest('hex');
  expect(loginSecret(token, userId)).toBe(expected);
  expect(loginSecret(token, userId)).not.toBe(loginSecret(token, userId + 1));
});
