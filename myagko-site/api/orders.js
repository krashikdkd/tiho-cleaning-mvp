import { randomUUID } from 'node:crypto';
import { getSql, ensureSchema } from '../lib/db.js';
import { isOwner } from '../lib/auth.js';
import { DEFAULT_SETTINGS, getSettings } from './settings.js';

const allowedStatuses = new Set(['Новая заявка', 'Подтверждена', 'В работе', 'Выполнена', 'Отменена']);

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function calculateTotal(items, outsideCity, settings) {
  const subtotal = items.reduce((sum, item) => {
    const unit = settings.prices[`${item.category}|${item.variant}`];
    return sum + (unit ? Math.round(unit * (item.dirty ? 1 + settings.dirtPercent / 100 : 1)) * Math.min(99, item.quantity) : 0);
  }, 0);
  return Math.max(subtotal, subtotal ? settings.minimum : 0) + (outsideCity ? settings.travel : 0);
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) return null;
  const allowedCategories = new Set(['sofa', 'armchair', 'mattress', 'chair', 'other']);
  const result = [];
  for (const raw of items) {
    const category = clean(raw?.category, 30);
    const variant = clean(raw?.variant, 80);
    const quantity = Number(raw?.quantity);
    if (!allowedCategories.has(category) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
    result.push({ category, variant, quantity, dirty: Boolean(raw?.dirty), description: clean(raw?.description, 300) });
  }
  return result;
}

function serialize(row) {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    name: row.customer_name,
    phone: row.phone,
    address: row.address,
    day: row.visit_date || '',
    time: row.visit_time || '',
    comment: row.comment || '',
    items: row.items,
    total: Number(row.total),
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  if (req.method !== 'POST' && !isOwner(req)) return res.status(401).json({ error: 'Войдите в кабинет владельца.' });

  try {
    const sql = getSql();
    await ensureSchema(sql);
    const settings = await getSettings(sql);

    if (req.method === 'GET') {
      const rows = await sql`SELECT id, created_at, status, customer_name, phone, address, visit_date, visit_time, comment, items, total FROM myagko_orders ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json({ orders: rows.map(serialize) });
    }

    if (req.method === 'PATCH') {
      const id = clean(req.body?.id, 80);
      const status = clean(req.body?.status, 40);
      if (!id || !allowedStatuses.has(status)) return res.status(400).json({ error: 'Некорректный статус заявки.' });
      const rows = await sql`UPDATE myagko_orders SET status = ${status} WHERE id = ${id} RETURNING id, created_at, status, customer_name, phone, address, visit_date, visit_time, comment, items, total`;
      if (!rows.length) return res.status(404).json({ error: 'Заявка не найдена.' });
      return res.status(200).json({ order: serialize(rows[0]) });
    }

    const body = req.body || {};
    const name = clean(body.name, 100);
    const phone = clean(body.phone, 40);
    const address = clean(body.address, 400);
    const digits = phone.replace(/\D/g, '');
    const items = normalizeItems(body.items);
    if (name.length < 2 || digits.length < 10 || digits.length > 15 || address.length < 5 || body.consent !== true || !items) {
      return res.status(400).json({ error: 'Проверьте имя, телефон, адрес, состав заказа и согласие на обработку данных.' });
    }
    if (items.some((item) => item.category === 'other' && item.description.length < 3)) {
      return res.status(400).json({ error: 'Опишите предмет, который нужно почистить.' });
    }

    const id = `M-${randomUUID().slice(0, 8).toUpperCase()}`;
    const total = calculateTotal(items, Boolean(body.city), settings);
    const rows = await sql`INSERT INTO myagko_orders (id, customer_name, phone, address, visit_date, visit_time, comment, items, total, consent)
      VALUES (${id}, ${name}, ${phone}, ${address}, ${clean(body.day, 20) || null}, ${clean(body.time, 20) || null}, ${clean(body.comment, 1000)}, ${JSON.stringify(items)}::jsonb, ${total}, TRUE)
      RETURNING id, created_at, status, customer_name, phone, address, visit_date, visit_time, comment, items, total`;
    return res.status(201).json({ order: serialize(rows[0]) });
  } catch (error) {
    console.error('Orders API failed', error);
    return res.status(503).json({ error: 'Сервис заявок пока не готов. Попробуйте позже.' });
  }
}
