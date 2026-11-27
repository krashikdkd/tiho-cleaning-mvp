import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'node:crypto';
import { getSql } from './db.js';

const COOKIE = 'myagko_owner';
const WEEK = 7 * 24 * 60 * 60;

function secret() {
  return process.env.MYAGKO_ADMIN_PASSWORD || '';
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

async function credentialHash(candidate) {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS myagko_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL)`;
  const rows = await sql`SELECT value FROM myagko_settings WHERE key = 'owner_password' LIMIT 1`;
  const saved = rows[0]?.value;
  if (saved?.salt && saved?.hash) {
    try {
      const derived = scryptSync(candidate, Buffer.from(saved.salt, 'base64url'), 64);
      const expected = Buffer.from(saved.hash, 'base64url');
      return expected.length === derived.length && timingSafeEqual(derived, expected);
    } catch { return false; }
  }
  const expected = secret();
  if (!expected) return false;
  const a = createHmac('sha256', 'compare').update(candidate).digest();
  const b = createHmac('sha256', 'compare').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function passwordMatches(candidate) {
  if (typeof candidate !== 'string' || candidate.length > 200) return false;
  return credentialHash(candidate);
}

export async function saveOwnerPassword(candidate) {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS myagko_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL)`;
  const salt = randomBytes(16);
  const hash = scryptSync(candidate, salt, 64);
  const value = { salt: salt.toString('base64url'), hash: hash.toString('base64url') };
  await sql`INSERT INTO myagko_settings (key, value) VALUES ('owner_password', ${JSON.stringify(value)}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

export function createSessionCookie() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + WEEK * 1000 })).toString('base64url');
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${WEEK}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isOwner(req) {
  if (!secret()) return false;
  const cookies = String(req.headers.cookie || '').split(';').map((part) => part.trim());
  const value = cookies.find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value) return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}
