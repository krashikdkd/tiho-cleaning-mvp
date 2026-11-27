import { clearSessionCookie, isOwner } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isOwner(req)) return res.status(401).json({ error: 'Не выполнен вход.' });
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.status(200).json({ authenticated: false });
}
