import { NextRequest, NextResponse } from "next/server";
import { createVote, getResults, addBallot } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { chatId, question, options } = await req.json();
  if (!chatId || !options) return NextResponse.json({ error: "missing data" }, { status: 400 });
  const vote = createVote(chatId, question, options);
  return NextResponse.json(vote);
}

export async function PUT(req: NextRequest) {
  const { voteId, ballot } = await req.json();
  if (!voteId || !ballot) return NextResponse.json({ error: "missing data" }, { status: 400 });
  addBallot(voteId, ballot);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const result = getResults(id);
  return NextResponse.json({ result });
}
