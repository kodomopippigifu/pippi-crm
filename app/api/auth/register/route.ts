import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (code !== process.env.REGISTRATION_CODE) {
    return NextResponse.json({ error: '登録コードが違います' }, { status: 401 });
  }

  const secret = process.env.DEVICE_SECRET!;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('pippi-device'));
  const token = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  const res = NextResponse.json({ ok: true });
  res.cookies.set('device_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 * 10,
    path: '/',
  });

  return res;
}
