import { isOwner, passwordMatches, saveOwnerPassword } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isOwner(req)) return res.status(401).json({ error: 'Войдите в кабинет владельца.' });
  const currentPassword = req.body?.currentPassword;
  const newPassword = req.body?.newPassword;
  const confirmation = req.body?.confirmation;
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 200) {
    return res.status(400).json({ error: 'Новый пароль должен содержать от 8 до 200 символов.' });
  }
  if (newPassword !== confirmation) return res.status(400).json({ error: 'Новые пароли не совпадают.' });
  if (newPassword === currentPassword) return res.status(400).json({ error: 'Новый пароль должен отличаться от текущего.' });
  try {
    if (!(await passwordMatches(currentPassword))) return res.status(401).json({ error: 'Текущий пароль введён неверно.' });
    await saveOwnerPassword(newPassword);
    return res.status(200).json({ ok: true, message: 'Пароль изменён.' });
  } catch (error) {
    console.error('Owner password update failed', error);
    return res.status(503).json({ error: 'Не удалось изменить пароль. Проверьте подключение базы данных.' });
  }
}
