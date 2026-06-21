import { NextRequest, NextResponse } from 'next/server';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const NOTIFY_SECRET = process.env.NOTIFY_SECRET!;

async function pushMessage(to: string, messages: any[]) {
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to, messages }),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-notify-secret');
  if (secret !== NOTIFY_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { lineUserId, serviceName, date, time, childName } = await req.json();

  if (!lineUserId || lineUserId === 'guest') {
    return NextResponse.json({ status: 'skipped' });
  }

  const text = `ご予約ありがとうございます😊

【ご予約内容】
サービス: ${serviceName}
日時: ${date} ${time}
お子様: ${childName}

※初めてのご利用の方は予約当日にお子様の保険証をご持参ください。`;

  await pushMessage(lineUserId, [{ type: 'text', text }]);

  return NextResponse.json({ status: 'ok' });
}
