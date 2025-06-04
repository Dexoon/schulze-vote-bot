import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }
  let token: string
  try {
    ;({ token } = await req.json())
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const url = new URL('/api/bot', req.url)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ token }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
