import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('device_token')?.value;
  const isAuthenticated = token && token === process.env.DEVICE_TOKEN;

  // 登録済みなのに /register に来た場合はホームへ
  if (pathname.startsWith('/register')) {
    if (isAuthenticated) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/register', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
