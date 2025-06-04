import crypto from "crypto";

export function verifyTelegramAuth(params: Record<string, string>, botToken: string): boolean {
  const hash = params.hash;
  if (!hash) return false;
  const data = Object.keys(params)
    .filter((k) => k !== "hash")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("\n");
  const secret = crypto
    .createHmac("sha256", crypto.createHash("sha256").update(botToken).digest())
    .update(data)
    .digest("hex");
  return secret === hash;
}
