import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import { verifyTelegramAuth } from '../src/lib/verifyTelegram';
import { schulze, Ballot } from '../src/lib/schulze';
import { createVote, addBallot, getResults } from '../src/lib/store';
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
  assert.equal(verifyTelegramAuth({ ...params, hash }, botToken), true);
});

test('verifyTelegramAuth invalid hash', () => {
  const botToken = '123:ABC';
  const params = {
    id: '1',
    first_name: 'Alice',
    auth_date: '123456',
    hash: 'wrong'
  };
  assert.equal(verifyTelegramAuth(params, botToken), false);
});

test('schulze ranking', () => {
  const ballots: Ballot[] = [
    { id: 'b1', rankings: [['A'], ['B'], ['C']] },
    { id: 'b2', rankings: [['A'], ['C'], ['B']] },
    { id: 'b3', rankings: [['B'], ['C'], ['A']] },
  ];
  assert.deepEqual(schulze(ballots), ['A', 'B', 'C']);
});

test('store vote lifecycle', () => {
  const vote = createVote('chat1', 'Best letter', ['A', 'B', 'C']);
  const ballot: Ballot = { id: 'u1', rankings: [['A'], ['B'], ['C']] };
  assert.equal(addBallot(vote.id, ballot), true);
  assert.deepEqual(getResults(vote.id), ['A', 'B', 'C']);
  assert.equal(addBallot('nonexistent', ballot), false);
});

test('loginSecret generates user specific secret', () => {
  const token = 'TESTTOKEN';
  const userId = 42;
  const expected = crypto.createHash('sha256').update(token + String(userId)).digest('hex');
  assert.equal(loginSecret(token, userId), expected);
  assert.notEqual(loginSecret(token, userId), loginSecret(token, userId + 1));
});
