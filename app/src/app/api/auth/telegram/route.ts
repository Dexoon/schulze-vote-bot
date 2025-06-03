import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth } from "@/lib/verifyTelegram";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  const token = process.env.BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "BOT_TOKEN not configured" }, { status: 500 });
  const ok = verifyTelegramAuth(params, token);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, user: params });
}
