import { getSql, ensureSchema } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  try {
    const sql = getSql();
    await ensureSchema(sql);
    const rows = await sql`SELECT 1 AS ok`;
    return res.status(200).json({ ok: rows[0]?.ok === 1, database: 'connected' });
  } catch (error) {
    console.error('Database health check failed', error);
    return res.status(503).json({ ok: false, database: 'not-ready' });
  }
}
