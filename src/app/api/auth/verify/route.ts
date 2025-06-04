import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import { loginSecret } from "@/lib/loginSecret";

export async function POST(req: NextRequest) {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  try {
    const body = await req.json();

    // Get the chat ID from the request
    const chatId = body.chatId;
    if (!chatId) {
      return NextResponse.json({ error: "missing chat ID" }, { status: 400 });
    }
    const expected = loginSecret(token, chatId);
    if (body.secret !== expected) {
      return NextResponse.json({ error: "invalid secret" }, { status: 401 });
    }

    // Initialize the bot
    const bot = new Telegraf(token);

    try {
      // Get chat information from Telegram
      const chat = await bot.telegram.getChat(chatId);
      
      if (!chat || !('first_name' in chat)) {
        return NextResponse.json({ error: "invalid chat" }, { status: 400 });
      }

      // Return the user information
      return NextResponse.json({
        ok: true,
        user: {
          id: chat.id,
          first_name: chat.first_name,
          last_name: 'last_name' in chat ? chat.last_name : undefined,
          username: 'username' in chat ? chat.username : undefined,
        }
      });
    } catch (err) {
      console.error("Failed to fetch chat from Telegram", err);
      return NextResponse.json({ error: "failed to fetch user information" }, { status: 500 });
    }
  } catch (err) {
    console.error("Failed to verify secret", err);
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
} 