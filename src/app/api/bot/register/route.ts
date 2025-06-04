import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  let token: string
  try {
    ;({ token } = await req.json())
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const url = new URL('/api/bot', process.env.NEXT_PUBLIC_BASE_URL || req.headers.get('origin') || 'http://localhost:3000')
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cookie': req.headers.get('cookie') || '',
    },
    body: JSON.stringify({ token }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
});
