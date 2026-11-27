(() => {
  const root = document.querySelector('#pricing-root');
  const defs = [
    ['sofa|2 места','Диван · 2 места'],['sofa|3 места','Диван · 3 места'],['sofa|Угловой','Диван · угловой'],
    ['armchair|Обычное','Кресло · обычное'],['armchair|Реклайнер','Кресло · реклайнер'],
    ['mattress|Односпальный','Матрас · односпальный'],['mattress|Двуспальный','Матрас · двуспальный'],
    ['chair|Сиденье','Стул · сиденье'],['chair|Со спинкой','Стул · со спинкой'],
  ];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const call = async (url, options={}) => {
    const response = await fetch(url,{...options,credentials:'same-origin',headers:{'content-type':'application/json',...(options.headers||{})}});
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'Не удалось выполнить запрос.');
    return data;
  };
  function showLogin(configured,message='') {
    root.innerHTML=`<form class="login" id="pricing-login"><label class="field">Пароль владельца<input name="password" type="password" autocomplete="current-password" required ${configured?'':'disabled'}></label><div class="actions"><button class="button primary" ${configured?'':'disabled'}>Войти в настройки</button></div><div class="message" role="status">${esc(message || (configured?'':'Добавьте MYAGKO_ADMIN_PASSWORD в настройках Vercel.'))}</div></form>`;
    root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;try{await call('/api/admin/login',{method:'POST',body:JSON.stringify({password:e.currentTarget.password.value})});await showEditor()}catch(error){root.querySelector('[role=status]').textContent=error.message;button.disabled=false}});
  }
  async function showEditor() {
    const settings=await call('/api/settings');
    root.innerHTML=`<h2>Тарифы на мебель</h2><p class="note">Цены указаны за одну единицу. Сильные загрязнения рассчитываются по проценту ниже.</p><form id="pricing-form"><div class="fields">${defs.map(([key,label])=>`<label class="field">${label}, ₽<input type="number" min="1" max="1000000" step="1" required data-price-key="${esc(key)}" value="${Number(settings.prices[key])||0}"></label>`).join('')}</div><div class="fields meta"><label class="field">Минимальный заказ, ₽<input name="minimum" type="number" min="0" max="1000000" step="1" required value="${settings.minimum}"></label><label class="field">Выезд за город, ₽<input name="travel" type="number" min="0" max="1000000" step="1" required value="${settings.travel}"></label><label class="field">Надбавка за загрязнения, %<input name="dirtPercent" type="number" min="0" max="300" step="1" required value="${settings.dirtPercent}"></label></div><div class="actions"><button class="button primary" type="submit">Сохранить тарифы</button><span class="message" role="status" aria-live="polite"></span><button class="button" type="button" id="logout">Выйти</button></div></form>`;
    const form=root.querySelector('#pricing-form');
    form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('[type=submit]'),message=form.querySelector('[role=status]');button.disabled=true;message.textContent='Сохраняем…';try{const prices=Object.fromEntries([...form.querySelectorAll('[data-price-key]')].map(i=>[i.dataset.priceKey,Number(i.value)]));const saved=await call('/api/settings',{method:'PUT',body:JSON.stringify({prices,minimum:Number(form.elements.namedItem('minimum').value),travel:Number(form.elements.namedItem('travel').value),dirtPercent:Number(form.elements.namedItem('dirtPercent').value)})});form.querySelectorAll('[data-price-key]').forEach(i=>i.value=saved.prices[i.dataset.priceKey]);message.textContent='Сохранено. Новые тарифы уже используются на сайте.'}catch(error){message.textContent=error.message}finally{button.disabled=false}});
    root.querySelector('#logout').addEventListener('click',async()=>{await call('/api/admin/logout',{method:'POST',body:'{}'}).catch(()=>{});showLogin(true,'Вы вышли из кабинета.')});
  }
  async function init(){try{const session=await call('/api/admin/session');if(session.authenticated)await showEditor();else showLogin(session.configured)}catch(error){root.innerHTML=`<p class="message">${esc(error.message)}</p><button class="button" onclick="location.reload()">Повторить</button>`}}
  init();
})();
