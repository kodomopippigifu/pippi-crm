import { NextResponse } from 'next/server';
import { db, initSchema } from '@/lib/db';

export async function GET() {
  await initSchema();
  const pool = db();

  const [total, expired, expiring, expiringList, expiredList, recentVisits] = await Promise.all([
    pool.query(`SELECT COUNT(*) as cnt FROM children`),
    pool.query(`SELECT COUNT(*) as cnt FROM memberships WHERE expiry_date < CURRENT_DATE::TEXT`),
    pool.query(`SELECT COUNT(*) as cnt FROM memberships WHERE expiry_date BETWEEN CURRENT_DATE::TEXT AND (CURRENT_DATE + INTERVAL '30 days')::TEXT`),
    pool.query(`
      SELECT c.id, c.last_name, c.first_name, c.nickname, m.expiry_date, m.membership_type, g.mobile_phone
      FROM children c
      JOIN memberships m ON m.child_id = c.id
      LEFT JOIN guardians g ON g.child_id = c.id
      WHERE m.expiry_date BETWEEN CURRENT_DATE::TEXT AND (CURRENT_DATE + INTERVAL '30 days')::TEXT
      ORDER BY m.expiry_date
    `),
    pool.query(`
      SELECT c.id, c.last_name, c.first_name, c.nickname, m.expiry_date, m.membership_type, g.mobile_phone
      FROM children c
      JOIN memberships m ON m.child_id = c.id
      LEFT JOIN guardians g ON g.child_id = c.id
      WHERE m.expiry_date < CURRENT_DATE::TEXT
      ORDER BY m.expiry_date DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT v.visit_date, v.memo, c.last_name, c.first_name, c.id as child_id
      FROM visit_records v
      JOIN children c ON c.id = v.child_id
      ORDER BY v.visit_date DESC, v.created_at DESC
      LIMIT 10
    `),
  ]);

  return NextResponse.json({
    total: parseInt(total.rows[0].cnt),
    expired: parseInt(expired.rows[0].cnt),
    expiring: parseInt(expiring.rows[0].cnt),
    expiringList: expiringList.rows,
    expiredList: expiredList.rows,
    recentVisits: recentVisits.rows,
  });
}
