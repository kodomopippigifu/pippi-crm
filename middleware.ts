import { NextRequest, NextResponse } from 'next/server';

async function getExpectedToken(): Promise<string> {
  const secret = process.env.DEVICE_SECRET!;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('pippi-device'));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/register') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('device_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/register', req.url));
  }

  const expected = await getExpectedToken();
  if (token !== expected) {
    return NextResponse.redirect(new URL('/register', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
