import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import { loginSecret } from "@/lib/loginSecret";

// Use global Telegraf in test mode, otherwise use the imported one
const TelegrafClass = process.env.NODE_ENV === 'test' 
  ? (globalThis as any).Telegraf || Telegraf
  : Telegraf;

export async function POST(req: NextRequest) {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  try {
    const body = await req.json();

    // Get the user ID from the request
    const userId = body.userId;
    if (!userId) {
      return NextResponse.json({ error: "missing user ID" }, { status: 400 });
    }
    const expected = loginSecret(token, userId);
    if (body.secret !== expected) {
      return NextResponse.json({ error: "invalid secret" }, { status: 401 });
    }

    // Initialize the bot
    const bot = new TelegrafClass(token);

    try {
      // Get chat information from Telegram
      const chat = await bot.telegram.getChat(userId);
      
      if (!chat || !('first_name' in chat)) {
        return NextResponse.json({ error: "invalid chat" }, { status: 400 });
      }

      const res = NextResponse.json({
        ok: true,
        user: {
          id: chat.id,
          first_name: chat.first_name,
          last_name: 'last_name' in chat ? chat.last_name : undefined,
          username: 'username' in chat ? chat.username : undefined,
        }
      });
      // Set login cookies so subsequent API calls are authenticated
      res.cookies.set('loginsecret', expected, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
      res.cookies.set('userId', String(userId), {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
      return res;
    } catch (err) {
      console.error("Failed to fetch chat from Telegram", err);
      return NextResponse.json({ error: "failed to fetch user information" }, { status: 500 });
    }
  } catch (err) {
    console.error("Failed to verify secret", err);
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
} 