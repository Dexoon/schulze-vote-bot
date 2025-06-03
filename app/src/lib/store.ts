import { Ballot, schulze } from "./schulze";
import crypto from "crypto";

export type Vote = {
  id: string;
  chatId: string;
  question: string;
  options: string[];
  ballots: Ballot[];
};

const votes = new Map<string, Vote>();

export function createVote(
  chatId: string,
  question: string,
  options: string[]
): Vote {
  const id = crypto.randomUUID();
  const vote: Vote = { id, chatId, question, options, ballots: [] };
  votes.set(id, vote);
  return vote;
}

export function addBallot(voteId: string, ballot: Ballot): boolean {
  const vote = votes.get(voteId);
  if (!vote) return false;
  vote.ballots.push(ballot);
  return true;
}

export function listVotes(chatId: string) {
  return Array.from(votes.values()).filter((v) => v.chatId === chatId);
}

export function getResults(voteId: string) {
  const vote = votes.get(voteId);
  if (!vote) return null;
  return schulze(vote.ballots);
}
