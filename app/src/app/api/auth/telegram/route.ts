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
  let ok = false;
  try {
    ok = verifyTelegramAuth(params, token);
  } catch (err) {
    console.error("verifyTelegramAuth error", err);
    return NextResponse.json({ error: "verification failed" }, { status: 400 });
  }
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  const user = {
    id: params.id,
    first_name: params.first_name,
    last_name: params.last_name,
    username: params.username,
    photo_url: params.photo_url,
  };
  return NextResponse.json({ ok: true, user });
}
