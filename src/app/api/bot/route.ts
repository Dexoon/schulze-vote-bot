import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";
import crypto from "crypto";
import { withAuth } from "@/lib/auth";

const rateLimitWindow = 60_000; // 60 seconds
const rateLimitCount = 5;
const requests = new Map<string, number[]>();

// Use global Telegraf in test mode, otherwise use the imported one
const TelegrafClass = process.env.NODE_ENV === 'test'
  ? (globalThis as any).Telegraf || Telegraf
  : Telegraf;

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const history = requests.get(ip) ?? [];
  const recent = history.filter((t) => now - t < rateLimitWindow);
  if (recent.length >= rateLimitCount) {
    return NextResponse.json({ error: "rate limit" }, { status: 429 });
  }
  recent.push(now);
  requests.set(ip, recent);

  let token: string;
  try {
    ({ token } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!token)
    return NextResponse.json({ error: "token required" }, { status: 400 });
  const tokenPattern = /^\d+:[A-Za-z0-9_-]{35,}$/;
  if (!tokenPattern.test(token)) {
    return NextResponse.json({ error: "invalid token format" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) {
    console.error("NEXT_PUBLIC_BASE_URL not configured");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const hash = crypto.createHash("sha256").update(token).digest("hex").slice(0, 16);
  const path = `api/webhook/${hash}`;
  const url = new URL(path, base).toString();
  const bot = new TelegrafClass(token);
  try {
    await bot.telegram.setWebhook(url, {
      secret_token: process.env.WEBHOOK_SECRET,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("failed to set webhook", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  console.log("webhook registered", ip, path);
  return NextResponse.json({ webhook: url, path });
});
