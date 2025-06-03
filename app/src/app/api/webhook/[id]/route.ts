import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const id = parts[parts.length - 2];
  const body = await req.json().catch(() => ({}));
  console.log("update", id, body);
  return NextResponse.json({ ok: true });
}
