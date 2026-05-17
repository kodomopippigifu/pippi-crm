import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

let schemaInitialized = false;

export async function initSchema() {
  if (schemaInitialized) return;
  schemaInitialized = true;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS children (
      id SERIAL PRIMARY KEY,
      last_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name_kana TEXT,
      first_name_kana TEXT,
      nickname TEXT,
      birth_date TEXT,
      gender TEXT,
      blood_type TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      membership_type TEXT DEFAULT '月会員',
      join_date TEXT,
      expiry_date TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS guardians (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      last_name TEXT,
      first_name TEXT,
      gender TEXT DEFAULT '女',
      birth_date TEXT,
      address TEXT,
      home_phone TEXT,
      mobile_phone TEXT,
      workplace_name TEXT,
      workplace_phone TEXT
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      name TEXT,
      relationship TEXT,
      birth_date TEXT,
      age INTEGER,
      occupation TEXT
    );

    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      order_num INTEGER,
      name TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      hospital_name TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS visit_records (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      visit_date TEXT NOT NULL,
      memo TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS allergy_notes (
      id SERIAL PRIMARY KEY,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export function db() {
  return pool;
}
