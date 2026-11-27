(() => {
  const root = document.querySelector('.cab-main');
  const statuses = ['Новая заявка', 'Подтверждена', 'В работе', 'Выполнена', 'Отменена'];
  const titles = { sofa: 'Диван', armchair: 'Кресло', mattress: 'Матрас', chair: 'Стул', other: 'Другое' };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const fmt = (value) => new Intl.NumberFormat('ru-RU').format(Number(value) || 0) + ' ₽';
  const date = (value) => { try { return new Date(value).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return value || ''; } };
  const call = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) }, credentials: 'same-origin' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Не удалось выполнить запрос.');
    return result;
  };

  function showLogin(configured, message = '') {
    root.innerHTML = `<div class="eyebrow">Кабинет владельца</div><h1>Вход для владельца.</h1><p class="cab-lead">Войдите, чтобы посмотреть новые заявки и управлять заказами.</p>${configured ? '' : '<p class="cab-notice"><strong>Нужно завершить настройку.</strong> Добавьте в Vercel переменную MYAGKO_ADMIN_PASSWORD — пароль владельца.</p>'}<form id="owner-login" class="owner-login"><label for="owner-password">Пароль владельца</label><input id="owner-password" type="password" autocomplete="current-password" required ${configured ? '' : 'disabled'}><button class="cab-button primary" ${configured ? '' : 'disabled'}>Войти в кабинет</button><p id="login-message" role="status">${esc(message)}</p></form>`;
    const form = root.querySelector('#owner-login');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button');
      const note = form.querySelector('#login-message');
      button.disabled = true;
      note.textContent = 'Проверяем пароль…';
      try {
        await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: form.querySelector('#owner-password').value }) });
        await load();
      } catch (error) {
        note.textContent = error.message;
        button.disabled = false;
      }
    });
  }

  const priceLabels = [
    ['sofa|2 места','Диван · 2 места'],['sofa|3 места','Диван · 3 места'],['sofa|Угловой','Диван · угловой'],
    ['armchair|Обычное','Кресло · обычное'],['armchair|Реклайнер','Кресло · реклайнер'],
    ['mattress|Односпальный','Матрас · односпальный'],['mattress|Двуспальный','Матрас · двуспальный'],
    ['chair|Сиденье','Стул · сиденье'],['chair|Со спинкой','Стул · со спинкой'],
  ];
  async function setupPricing() {
    const form = root.querySelector('#pricing-form');
    if (!form) return;
    const message = form.querySelector('[role=status]');
    try {
      const settings = await call('/api/settings');
      form.querySelector('#price-fields').innerHTML = priceLabels.map(([key,label]) => `<label class="price-field">${label}, ₽<input type="number" min="1" max="1000000" step="1" required data-price-key="${esc(key)}" value="${Number(settings.prices[key]) || 0}"></label>`).join('');
      form.querySelector('[name=minimum]').value = settings.minimum;
      form.querySelector('[name=travel]').value = settings.travel;
      form.querySelector('[name=dirtPercent]').value = settings.dirtPercent;
    } catch (error) { message.textContent = error.message; }
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type=submit]');
      button.disabled = true; message.textContent = 'Сохраняем…';
      try {
        const prices = Object.fromEntries([...form.querySelectorAll('[data-price-key]')].map((input) => [input.dataset.priceKey, Number(input.value)]));
        const saved = await call('/api/settings', { method: 'PUT', body: JSON.stringify({ prices, minimum: Number(form.elements.namedItem('minimum').value), travel: Number(form.elements.namedItem('travel').value), dirtPercent: Number(form.elements.namedItem('dirtPercent').value) }) });
        form.querySelectorAll('[data-price-key]').forEach((input) => { input.value = saved.prices[input.dataset.priceKey]; });
        message.textContent = 'Тарифы сохранены. Новые расчёты уже используют их.';
      } catch (error) { message.textContent = error.message; }
      finally { button.disabled = false; }
    });
  }

  function showOrders(orders) {
    const countNew = orders.filter((order) => order.status === 'Новая заявка').length;
    const countActive = orders.filter((order) => ['Подтверждена', 'В работе'].includes(order.status)).length;
    const cards = orders.length ? orders.map((order) => `<article class="cab-order" data-order-card data-search="${esc([order.name, order.phone, order.address, order.id].join(' ').toLocaleLowerCase('ru'))}" data-order-status="${esc(order.status)}"><div class="cab-order-top"><div><h3>${esc(order.name)} <span class="cab-muted">· ${esc(order.phone)}</span></h3><div class="cab-id">Заявка ${esc(order.id)} · ${esc(date(order.createdAt))}</div></div><div class="cab-total">${fmt(order.total)}</div></div><div class="cab-details"><div><b>Адрес</b>${esc(order.address)}</div><div><b>Дата и время</b>${esc([order.day, order.time].filter(Boolean).join(' · ') || 'По согласованию')}</div><div><b>Комментарий</b>${esc(order.comment || '—')}</div><div><b>Состав заказа</b><ul class="cab-items">${(order.items || []).map((item) => `<li>${esc(titles[item.category] || item.category)}${item.variant ? ` · ${esc(item.variant)}` : ''} × ${esc(item.quantity)}${item.dirty ? ' · сильные загрязнения' : ''}${item.description ? ` · ${esc(item.description)}` : ''}</li>`).join('')}</ul></div></div><div class="cab-status"><label>Статус <select data-status="${esc(order.id)}">${statuses.map((status) => `<option${order.status === status ? ' selected' : ''}>${esc(status)}</option>`).join('')}</select></label><button class="cab-button primary" data-save="${esc(order.id)}">Сохранить статус</button><span class="cab-muted" data-saved="${esc(order.id)}"></span></div></article>`).join('') : '<div class="cab-empty">Пока нет заявок. Когда клиент оформит заказ, он появится здесь.</div>';
    root.innerHTML = `<div class="eyebrow">Кабинет владельца</div><h1>Заявки и заказы.</h1><p class="cab-lead">Все заявки доступны в этом кабинете с любого устройства.</p><section class="cab-stats" aria-label="Сводка"><div class="cab-stat"><span>Всего заявок</span><strong>${orders.length}</strong></div><div class="cab-stat"><span>Новые</span><strong>${countNew}</strong></div><div class="cab-stat"><span>В работе</span><strong>${countActive}</strong></div></section><section class="price-admin"><h2>Цены и тарифы</h2><p>Изменения появятся в расчёте, заявках и на странице услуг.</p><form id="pricing-form"><div class="price-grid" id="price-fields"></div><div class="price-meta"><label class="price-field">Минимальный заказ, ₽<input name="minimum" type="number" min="0" max="1000000" step="100" required></label><label class="price-field">Выезд за город, ₽<input name="travel" type="number" min="0" max="1000000" step="100" required></label><label class="price-field">Надбавка за сильные загрязнения, %<input name="dirtPercent" type="number" min="0" max="300" step="1" required></label></div><div class="price-submit"><button class="cab-button primary" type="submit">Сохранить тарифы</button><span role="status" aria-live="polite"></span></div></form></section><div class="cab-orders-head"><h2>Заявки</h2><div class="cab-tools"><input class="cab-search" id="order-search" type="search" placeholder="Имя, телефон или адрес" aria-label="Найти заявку"><select class="cab-filter" id="status-filter" aria-label="Фильтр по статусу"><option value="">Все статусы</option>${statuses.map((status) => `<option>${esc(status)}</option>`).join('')}</select><button class="cab-button" id="refresh">Обновить</button><button class="cab-button" id="logout">Выйти</button></div></div><section id="orders" aria-live="polite">${cards}<p id="no-matches" class="cab-empty" hidden>По этому запросу ничего не найдено.</p></section>`;
    setupPricing();
    root.querySelector('#refresh').addEventListener('click', load);
    root.querySelector('#logout').addEventListener('click', async () => { await call('/api/admin/logout', { method: 'POST', body: '{}' }).catch(() => {}); showLogin(true); });
    const filterCards = () => {
      const query = root.querySelector('#order-search').value.trim().toLocaleLowerCase('ru');
      const status = root.querySelector('#status-filter').value;
      let visible = 0;
      root.querySelectorAll('[data-order-card]').forEach((card) => {
        const match = (!query || card.dataset.search.includes(query)) && (!status || card.dataset.orderStatus === status);
        card.hidden = !match;
        if (match) visible++;
      });
      root.querySelector('#no-matches').hidden = visible > 0 || !orders.length;
    };
    root.querySelector('#order-search').addEventListener('input', filterCards);
    root.querySelector('#status-filter').addEventListener('change', filterCards);
    root.querySelectorAll('[data-save]').forEach((button) => button.addEventListener('click', async () => {
      button.disabled = true;
      const note = root.querySelector(`[data-saved="${CSS.escape(button.dataset.save)}"]`);
      try {
        const status = root.querySelector(`[data-status="${CSS.escape(button.dataset.save)}"]`).value;
        await call('/api/orders', { method: 'PATCH', body: JSON.stringify({ id: button.dataset.save, status }) });
        const card = button.closest('[data-order-card]');
        card.dataset.orderStatus = status;
        note.textContent = 'Сохранено';
        filterCards();
      } catch (error) { note.textContent = error.message; }
      finally { button.disabled = false; }
    }));
  }

  async function load() {
    try {
      const session = await call('/api/admin/session');
      if (!session.authenticated) return showLogin(session.configured);
      const result = await call('/api/orders');
      showOrders(result.orders || []);
    } catch (error) {
      root.innerHTML = `<div class="eyebrow">Кабинет владельца</div><h1>Не удалось загрузить заявки.</h1><p class="cab-lead">${esc(error.message)}</p><button class="cab-button" id="retry">Повторить</button>`;
      root.querySelector('#retry').addEventListener('click', load);
    }
  }
  load();
})();
