import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  const bot = new Telegraf(token);
  const base = process.env.BASE_URL || "https://example.com";
  const path = `api/webhook/${token.slice(0, 8)}`;
  const url = `${base}/${path}`;
  try {
    await bot.telegram.setWebhook(url);
  } catch {
    return NextResponse.json({ error: "failed to set webhook" }, { status: 500 });
  }
  return NextResponse.json({ webhook: url, path });
}
