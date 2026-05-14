import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code, deviceId } = await req.json();

  if (code !== process.env.REGISTRATION_CODE) {
    return NextResponse.json({ error: '登録コードが違います' }, { status: 401 });
  }

  const timestamp = Date.now().toString();
  const payload = `${deviceId}.${timestamp}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.DEVICE_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigArr = new Uint8Array(sig);
  let sigStr = '';
  sigArr.forEach(b => { sigStr += String.fromCharCode(b); });
  const token = `${payload}.${btoa(sigStr)}`;

  const res = NextResponse.json({ ok: true });
  res.cookies.set('device_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365 * 10,
    path: '/',
  });

  return res;
}
