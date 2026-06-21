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

function buildBookingFlexMessage({
  serviceName,
  date,
  time,
  childName,
}: {
  serviceName: string;
  date: string;
  time: string;
  childName: string;
}) {
  return {
    type: 'flex',
    altText: 'ご予約が完了しました',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#06C755',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '✅ ご予約完了',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'ご予約ありがとうございます😊',
            wrap: true,
            size: 'sm',
            color: '#555555',
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'サービス', size: 'sm', color: '#888888', flex: 3 },
                  { type: 'text', text: serviceName, size: 'sm', color: '#111111', weight: 'bold', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '日時', size: 'sm', color: '#888888', flex: 3 },
                  { type: 'text', text: `${date} ${time}`, size: 'sm', color: '#111111', weight: 'bold', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'お子様', size: 'sm', color: '#888888', flex: 3 },
                  { type: 'text', text: childName, size: 'sm', color: '#111111', weight: 'bold', flex: 5, wrap: true },
                ],
              },
            ],
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'text',
            text: '※初めてのご利用の方は予約当日にお子様の保険証をご持参ください。',
            wrap: true,
            size: 'xs',
            color: '#999999',
            margin: 'lg',
          },
        ],
      },
    },
  };
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

  const message = buildBookingFlexMessage({ serviceName, date, time, childName });

  await pushMessage(lineUserId, [message]);

  return NextResponse.json({ status: 'ok' });
}
