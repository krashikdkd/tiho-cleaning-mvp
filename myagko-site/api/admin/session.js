import { isOwner } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ authenticated: isOwner(req), configured: Boolean(process.env.MYAGKO_ADMIN_PASSWORD) });
}
