import { neon } from '@neondatabase/serverless';

let schemaReady;

export function getSql() {
  const connectionString = process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.NEON_DATABASE_URL;
  if (!connectionString) throw new Error('Database is not connected');
  return neon(connectionString);
}

export async function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = sql`CREATE TABLE IF NOT EXISTS myagko_orders (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'Новая заявка',
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      visit_date TEXT,
      visit_time TEXT,
      comment TEXT,
      items JSONB NOT NULL,
      total INTEGER NOT NULL,
      consent BOOLEAN NOT NULL DEFAULT FALSE
    )`.catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}
