import { NextRequest, NextResponse } from 'next/server';

async function verifyToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [deviceId, timestamp, sig] = parts;
    const secret = process.env.DEVICE_SECRET;
    if (!secret) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = new TextEncoder().encode(`${deviceId}.${timestamp}`);
    const sigStr = atob(sig);
    const signature = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) signature[i] = sigStr.charCodeAt(i);

    return await crypto.subtle.verify('HMAC', key, signature, data);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/register') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('device_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.redirect(new URL('/register', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
