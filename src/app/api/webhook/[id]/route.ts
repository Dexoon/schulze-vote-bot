import { NextRequest, NextResponse } from "next/server";

// Ensure this route is treated as dynamic so `params` can be read synchronously
export const dynamic = "force-dynamic";
import { Telegraf } from "telegraf";
import crypto from "crypto";

const secret = process.env.WEBHOOK_SECRET;
const token = process.env.BOT_TOKEN;
const base = process.env.BASE_URL;

let mainId: string | null = null;
let bot: Telegraf | null = null;
let loginUrl: string | null = null;

if (token && base) {
  mainId = crypto.createHash("sha256").update(token).digest("hex").slice(0, 16);
  bot = new Telegraf(token);
  loginUrl = `${base.replace(/\/$/, "")}/login`;
}

export async function POST(req: NextRequest, context: unknown) {
  const { params } = context as { params: Record<string, string> };
  if (!secret) {
    console.error("WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const provided = req.headers.get("x-telegram-bot-api-secret-token");
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("Invalid JSON in webhook", err);
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (typeof body === "object" && body !== null && "update_id" in body) {
    console.log(
      "update",
      params.id,
      (body as Record<string, unknown>).update_id
    );
  } else {
    console.log("update", params.id);
  }

  if (bot && loginUrl && params.id === mainId) {
    const update = body as {
      message?: { chat?: { id?: number } };
    };
    const chatId = update.message?.chat?.id;
    if (chatId) {
      try {
        await bot.telegram.sendMessage(chatId, "Use this link to log in:", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Log in",
                  login_url: { url: loginUrl },
                },
              ],
            ],
          },
        });
      } catch (err) {
        console.error("failed to send login link", err);
      }
    }
  }
  return NextResponse.json({ ok: true });
}


