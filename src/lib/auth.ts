import { NextRequest, NextResponse } from 'next/server';

export function withAuth(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const loginSecret = req.cookies.get('loginsecret')?.value;
    const userId = req.cookies.get('userId')?.value;
    
    if (!loginSecret || !userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    return handler(req, userId);
  };
} 