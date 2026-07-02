import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const email = process.env.LOCAL_SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || 'admin@globalmarketsuite.local';
const password = process.env.LOCAL_SUPERADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD || 'MySecretPassword123!';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'admin',
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);

const passwordHash = await bcrypt.hash(password, 12);
await pool.query(
  `INSERT INTO users (email, password_hash, role)
   VALUES ($1, $2, 'admin')
   ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash`,
  [email, passwordHash],
);
await pool.end();

console.log(`Superadmin ready: ${email}`);
