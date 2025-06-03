import { NextRequest, NextResponse } from "next/server";

const secret = process.env.WEBHOOK_SECRET;

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
  return NextResponse.json({ ok: true });
}
