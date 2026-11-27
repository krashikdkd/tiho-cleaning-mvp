import { createSessionCookie, passwordMatches } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.MYAGKO_ADMIN_PASSWORD) return res.status(503).json({ error: 'Кабинет ещё не настроен владельцем.' });
  const password = req.body?.password;
  if (!(await passwordMatches(password))) return res.status(401).json({ error: 'Неверный пароль.' });
  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ authenticated: true });
}
