import { NextRequest, NextResponse } from 'next/server';
import { db, initSchema } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const pool = db();

  const childRes = await pool.query(`SELECT * FROM children WHERE id=$1`, [id]);
  if (!childRes.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [membership, guardian, family_members, emergency_contacts, hospital, allergy, visitCount] = await Promise.all([
    pool.query(`SELECT * FROM memberships WHERE child_id=$1`, [id]),
    pool.query(`SELECT * FROM guardians WHERE child_id=$1`, [id]),
    pool.query(`SELECT * FROM family_members WHERE child_id=$1`, [id]),
    pool.query(`SELECT * FROM emergency_contacts WHERE child_id=$1 ORDER BY order_num`, [id]),
    pool.query(`SELECT * FROM hospitals WHERE child_id=$1`, [id]),
    pool.query(`SELECT * FROM allergy_notes WHERE child_id=$1`, [id]),
    pool.query(`SELECT COUNT(*) as cnt FROM visit_records WHERE child_id=$1`, [id]),
  ]);

  return NextResponse.json({
    child: childRes.rows[0],
    membership: membership.rows[0] || null,
    guardian: guardian.rows[0] || null,
    family_members: family_members.rows,
    emergency_contacts: emergency_contacts.rows,
    hospital: hospital.rows[0] || null,
    allergy: allergy.rows[0] || null,
    visit_count: parseInt(visitCount.rows[0].cnt),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const body = await req.json();
  const pool = db();

  await pool.query(
    `UPDATE children SET last_name=$1, first_name=$2, last_name_kana=$3, first_name_kana=$4, nickname=$5, birth_date=$6, gender=$7, blood_type=$8, updated_at=NOW() WHERE id=$9`,
    [body.last_name, body.first_name, body.last_name_kana, body.first_name_kana, body.nickname, body.birth_date, body.gender, body.blood_type, id]
  );

  const existingM = await pool.query(`SELECT id FROM memberships WHERE child_id=$1`, [id]);
  if (existingM.rows.length) {
    await pool.query(
      `UPDATE memberships SET membership_type=$1, join_date=$2, expiry_date=$3, notes=$4, updated_at=NOW() WHERE child_id=$5`,
      [body.membership_type, body.join_date, body.expiry_date, body.membership_notes, id]
    );
  } else {
    await pool.query(
      `INSERT INTO memberships (child_id, membership_type, join_date, expiry_date, notes) VALUES ($1,$2,$3,$4,$5)`,
      [id, body.membership_type, body.join_date, body.expiry_date, body.membership_notes]
    );
  }

  const existingG = await pool.query(`SELECT id FROM guardians WHERE child_id=$1`, [id]);
  if (body.guardian) {
    const g = body.guardian;
    if (existingG.rows.length) {
      await pool.query(
        `UPDATE guardians SET last_name=$1, first_name=$2, gender=$3, birth_date=$4, address=$5, home_phone=$6, mobile_phone=$7, workplace_name=$8, workplace_phone=$9 WHERE child_id=$10`,
        [g.last_name, g.first_name, g.gender, g.birth_date, g.address, g.home_phone, g.mobile_phone, g.workplace_name, g.workplace_phone, id]
      );
    } else {
      await pool.query(
        `INSERT INTO guardians (child_id, last_name, first_name, gender, birth_date, address, home_phone, mobile_phone, workplace_name, workplace_phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, g.last_name, g.first_name, g.gender, g.birth_date, g.address, g.home_phone, g.mobile_phone, g.workplace_name, g.workplace_phone]
      );
    }
  }

  await pool.query(`DELETE FROM family_members WHERE child_id=$1`, [id]);
  for (const fm of (body.family_members || [])) {
    await pool.query(
      `INSERT INTO family_members (child_id, name, relationship, birth_date, age, occupation) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, fm.name, fm.relationship, fm.birth_date, fm.age || null, fm.occupation]
    );
  }

  await pool.query(`DELETE FROM emergency_contacts WHERE child_id=$1`, [id]);
  for (const ec of (body.emergency_contacts || [])) {
    await pool.query(
      `INSERT INTO emergency_contacts (child_id, order_num, name, phone) VALUES ($1,$2,$3,$4)`,
      [id, ec.order_num, ec.name, ec.phone]
    );
  }

  const existingH = await pool.query(`SELECT id FROM hospitals WHERE child_id=$1`, [id]);
  if (body.hospital_name) {
    if (existingH.rows.length) {
      await pool.query(`UPDATE hospitals SET hospital_name=$1, phone=$2 WHERE child_id=$3`, [body.hospital_name, body.hospital_phone, id]);
    } else {
      await pool.query(`INSERT INTO hospitals (child_id, hospital_name, phone) VALUES ($1,$2,$3)`, [id, body.hospital_name, body.hospital_phone]);
    }
  }

  const existingA = await pool.query(`SELECT id FROM allergy_notes WHERE child_id=$1`, [id]);
  if (body.allergy_notes) {
    if (existingA.rows.length) {
      await pool.query(`UPDATE allergy_notes SET content=$1 WHERE child_id=$2`, [body.allergy_notes, id]);
    } else {
      await pool.query(`INSERT INTO allergy_notes (child_id, content) VALUES ($1,$2)`, [id, body.allergy_notes]);
    }
  } else if (existingA.rows.length) {
    await pool.query(`DELETE FROM allergy_notes WHERE child_id=$1`, [id]);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  await db().query(`DELETE FROM children WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
