import { NextRequest, NextResponse } from "next/server";
import { createVote, getResults, addBallot } from "@/lib/store";
import type { Ballot } from "@/lib/schulze";

export async function POST(req: NextRequest) {
  let chatId: string, question: string, options: string[];
  try {
    ({ chatId, question, options } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!chatId || !options || !question)
    return NextResponse.json({ error: "missing data" }, { status: 400 });
  const vote = createVote(chatId, question, options);
  return NextResponse.json(vote);
}

export async function PUT(req: NextRequest) {
  let voteId: string, ballot: Ballot;
  try {
    ({ voteId, ballot } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!voteId || !ballot)
    return NextResponse.json({ error: "missing data" }, { status: 400 });
  const ok = addBallot(voteId, ballot);
  if (!ok)
    return NextResponse.json({ error: "vote not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = getResults(id);
    if (!result)
      return NextResponse.json({ error: "vote not found" }, { status: 404 });
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
