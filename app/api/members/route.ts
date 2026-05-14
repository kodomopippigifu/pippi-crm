import { NextRequest, NextResponse } from 'next/server';
import { db, initSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  await initSchema();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';

  let query = `
    SELECT
      c.id, c.last_name, c.first_name, c.last_name_kana, c.first_name_kana,
      c.nickname, c.birth_date, c.gender, c.blood_type,
      m.membership_type, m.join_date, m.expiry_date,
      g.mobile_phone, g.address,
      g.last_name AS guardian_last, g.first_name AS guardian_first
    FROM children c
    LEFT JOIN memberships m ON m.child_id = c.id
    LEFT JOIN guardians g ON g.child_id = c.id
    WHERE 1=1
  `;
  const params: string[] = [];
  let idx = 1;

  if (q) {
    query += ` AND (c.last_name ILIKE $${idx} OR c.first_name ILIKE $${idx} OR c.last_name_kana ILIKE $${idx} OR c.first_name_kana ILIKE $${idx} OR g.last_name ILIKE $${idx} OR g.first_name ILIKE $${idx})`;
    params.push(`%${q}%`);
    idx++;
  }

  if (status === 'expired') {
    query += ` AND m.expiry_date < CURRENT_DATE::TEXT`;
  } else if (status === 'expiring') {
    query += ` AND m.expiry_date BETWEEN CURRENT_DATE::TEXT AND (CURRENT_DATE + INTERVAL '7 days')::TEXT`;
  } else if (status === 'active') {
    query += ` AND (m.expiry_date IS NULL OR m.expiry_date >= CURRENT_DATE::TEXT)`;
  }

  query += ` ORDER BY c.last_name, c.first_name`;

  const result = await db().query(query, params);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  await initSchema();
  const body = await req.json();
  const pool = db();

  const childResult = await pool.query(
    `INSERT INTO children (last_name, first_name, last_name_kana, first_name_kana, nickname, birth_date, gender, blood_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [body.last_name, body.first_name, body.last_name_kana, body.first_name_kana,
     body.nickname, body.birth_date, body.gender, body.blood_type]
  );
  const childId = childResult.rows[0].id;

  await pool.query(
    `INSERT INTO memberships (child_id, membership_type, join_date, expiry_date, notes) VALUES ($1,$2,$3,$4,$5)`,
    [childId, body.membership_type || '月会員', body.join_date, body.expiry_date, body.membership_notes]
  );

  if (body.guardian) {
    const g = body.guardian;
    await pool.query(
      `INSERT INTO guardians (child_id, last_name, first_name, gender, birth_date, address, home_phone, mobile_phone, workplace_name, workplace_phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [childId, g.last_name, g.first_name, g.gender, g.birth_date, g.address, g.home_phone, g.mobile_phone, g.workplace_name, g.workplace_phone]
    );
  }

  if (body.family_members?.length) {
    for (const fm of body.family_members) {
      await pool.query(
        `INSERT INTO family_members (child_id, name, relationship, birth_date, age, occupation) VALUES ($1,$2,$3,$4,$5,$6)`,
        [childId, fm.name, fm.relationship, fm.birth_date, fm.age || null, fm.occupation]
      );
    }
  }

  if (body.emergency_contacts?.length) {
    for (const ec of body.emergency_contacts) {
      await pool.query(
        `INSERT INTO emergency_contacts (child_id, order_num, name, phone) VALUES ($1,$2,$3,$4)`,
        [childId, ec.order_num, ec.name, ec.phone]
      );
    }
  }

  if (body.hospital_name) {
    await pool.query(
      `INSERT INTO hospitals (child_id, hospital_name, phone) VALUES ($1,$2,$3)`,
      [childId, body.hospital_name, body.hospital_phone]
    );
  }

  if (body.allergy_notes) {
    await pool.query(
      `INSERT INTO allergy_notes (child_id, content) VALUES ($1,$2)`,
      [childId, body.allergy_notes]
    );
  }

  return NextResponse.json({ id: childId }, { status: 201 });
}
