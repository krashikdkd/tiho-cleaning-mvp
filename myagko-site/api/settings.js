import { getSql, ensureSchema } from '../lib/db.js';
import { isOwner } from '../lib/auth.js';

export const DEFAULT_SETTINGS = {
  prices: {
    'sofa|2 места': 1800, 'sofa|3 места': 2400, 'sofa|Угловой': 3400,
    'armchair|Обычное': 1200, 'armchair|Реклайнер': 1600,
    'mattress|Односпальный': 1400, 'mattress|Двуспальный': 2000,
    'chair|Сиденье': 350, 'chair|Со спинкой': 500,
  },
  minimum: 2000,
  travel: 500,
  dirtPercent: 20,
};

async function readSettings(sql) {
  await sql`CREATE TABLE IF NOT EXISTS myagko_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL)`;
  const rows = await sql`SELECT value FROM myagko_settings WHERE key = 'pricing' LIMIT 1`;
  const value = rows[0]?.value;
  return value && typeof value === 'object' ? { ...DEFAULT_SETTINGS, ...value, prices: { ...DEFAULT_SETTINGS.prices, ...(value.prices || {}) } } : DEFAULT_SETTINGS;
}

export async function getSettings(sql = getSql()) {
  await ensureSchema(sql);
  return readSettings(sql);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'PUT'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  if (req.method === 'PUT' && !isOwner(req)) return res.status(401).json({ error: 'Войдите в кабинет владельца.' });
  try {
    const sql = getSql();
    await ensureSchema(sql);
    if (req.method === 'GET') return res.status(200).json(await readSettings(sql));
    const current = req.body || {};
    const prices = {};
    for (const key of Object.keys(DEFAULT_SETTINGS.prices)) {
      const amount = Number(current.prices?.[key]);
      if (!Number.isInteger(amount) || amount < 1 || amount > 1000000) return res.status(400).json({ error: 'Укажите цену от 1 до 1 000 000 ₽ для каждой позиции.' });
      prices[key] = amount;
    }
    const minimum = Number(current.minimum), travel = Number(current.travel), dirtPercent = Number(current.dirtPercent);
    if (![minimum, travel, dirtPercent].every(Number.isInteger) || minimum < 0 || minimum > 1000000 || travel < 0 || travel > 1000000 || dirtPercent < 0 || dirtPercent > 300) {
      return res.status(400).json({ error: 'Проверьте минимальный заказ, выезд и надбавку за сильные загрязнения.' });
    }
    const settings = { prices, minimum, travel, dirtPercent };
    await sql`INSERT INTO myagko_settings (key, value) VALUES ('pricing', ${JSON.stringify(settings)}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Settings API failed', error);
    return res.status(503).json({ error: 'Не удалось загрузить или сохранить настройки. Проверьте подключение базы данных.' });
  }
}
