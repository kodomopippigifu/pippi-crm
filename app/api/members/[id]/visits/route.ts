import { NextRequest, NextResponse } from 'next/server';
import { db, initSchema } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const result = await db().query(`SELECT * FROM visit_records WHERE child_id=$1 ORDER BY visit_date DESC`, [id]);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const body = await req.json();
  const result = await db().query(
    `INSERT INTO visit_records (child_id, visit_date, memo) VALUES ($1,$2,$3) RETURNING id`,
    [id, body.visit_date, body.memo]
  );
  return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { searchParams } = new URL(req.url);
  const visitId = searchParams.get('visitId');
  if (!visitId) return NextResponse.json({ error: 'visitId required' }, { status: 400 });
  const { id } = await params;
  await db().query(`DELETE FROM visit_records WHERE id=$1 AND child_id=$2`, [visitId, id]);
  return NextResponse.json({ ok: true });
}
