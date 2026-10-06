import { neon } from "@neondatabase/serverless";

let initialized = false;

export function db() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  return neon(databaseUrl);
}

export async function ensureSchema() {
  if (initialized) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS work_logs (
      id BIGSERIAL PRIMARY KEY,
      entry TEXT NOT NULL CHECK (char_length(entry) <= 1000),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  initialized = true;
}
