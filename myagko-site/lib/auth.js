import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'myagko_owner';
const WEEK = 7 * 24 * 60 * 60;

function secret() {
  return process.env.MYAGKO_ADMIN_PASSWORD || '';
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function passwordMatches(candidate) {
  const expected = secret();
  if (!expected || typeof candidate !== 'string') return false;
  const a = createHmac('sha256', 'compare').update(candidate).digest();
  const b = createHmac('sha256', 'compare').update(expected).digest();
  return timingSafeEqual(a, b);
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
