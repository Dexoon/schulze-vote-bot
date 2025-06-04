import { NextRequest, NextResponse } from 'next/server';
import { loginSecret } from '@/lib/loginSecret';

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/webhook')) {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
    }
    const secret = req.cookies.get('loginsecret')?.value;
    const userId = req.cookies.get('userId')?.value;
    if (!secret || !userId || secret !== loginSecret(token, userId)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
