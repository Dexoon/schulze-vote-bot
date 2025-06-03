import { Ballot, schulze } from "./schulze";

export type Vote = {
  id: string;
  chatId: string;
  question: string;
  options: string[];
  ballots: Ballot[];
};

const votes = new Map<string, Vote>();

export function createVote(chatId: string, question: string, options: string[]): Vote {
  const id = Math.random().toString(36).slice(2, 10);
  const vote: Vote = { id, chatId, question, options, ballots: [] };
  votes.set(id, vote);
  return vote;
}

export function addBallot(voteId: string, ballot: Ballot) {
  const vote = votes.get(voteId);
  if (!vote) return;
  vote.ballots.push(ballot);
}

export function listVotes(chatId: string) {
  return Array.from(votes.values()).filter((v) => v.chatId === chatId);
}

export function getResults(voteId: string) {
  const vote = votes.get(voteId);
  if (!vote) return [];
  return schulze(vote.ballots);
}
