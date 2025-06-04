import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth } from "@/lib/verifyTelegram";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const chatId = searchParams.get('chat_id');
  if (!token || !chatId) {
    return NextResponse.json({ error: 'token and chat_id required' }, { status: 400 });
  }
  const tokenPattern = /^\d+:[A-Za-z0-9_-]{35,}$/;
  if (!tokenPattern.test(token)) {
    return NextResponse.json({ error: 'invalid token' }, { status: 400 });
  }
  if (!/^-?\d+$/.test(chatId)) {
    return NextResponse.json({ error: 'invalid chat_id' }, { status: 400 });
  }
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    if (k !== 'token' && k !== 'chat_id') params[k] = v;
  });
  const botToken = process.env.BOT_TOKEN;
  if (!botToken)
    return NextResponse.json({ error: 'BOT_TOKEN not configured' }, { status: 500 });
  let ok = false;
  try {
    ok = verifyTelegramAuth(params, botToken);
  } catch (err) {
    console.error('verifyTelegramAuth error', err);
    return NextResponse.json({ error: 'verification failed' }, { status: 400 });
  }
  if (!ok) return NextResponse.json({ error: 'invalid hash' }, { status: 401 });
  const user = {
    id: params.id,
    first_name: params.first_name,
    last_name: params.last_name,
    username: params.username,
    photo_url: params.photo_url,
  };
  return NextResponse.json({ ok: true, user });
}
