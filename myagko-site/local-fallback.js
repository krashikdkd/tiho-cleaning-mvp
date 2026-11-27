(() => {
  const root = document.querySelector('.app');
  const scene = document.querySelector('.scene-wrap');
  const tabs = [...document.querySelectorAll('.category-dock [role="tab"]')];
  const rates = { sofa: { '2 места': 1800, '3 места': 2400, 'Угловой': 3400 }, armchair: { 'Обычное': 1200, 'Реклайнер': 1600 }, mattress: { 'Односпальный': 1400, 'Двуспальный': 2000 }, chair: { 'Сиденье': 350, 'Со спинкой': 500 } };
  let minimumOrder=2000, dirtyPercent=20;
  const categories=['sofa','armchair','mattress','chair','other'];
  const names={sofa:'Диван',armchair:'Кресло',mattress:'Матрас',chair:'Стул',other:'Другое'};
  const pics={sofa:'sofa-clean-front.webp',armchair:'armchair-clean-front.webp',mattress:'mattress-clean-front.webp',chair:'chair-clean-front.webp'};
  const models={sofa:'divan.glb',armchair:'kreslo.glb',mattress:'matras.glb',chair:'stul.glb'};
  const defaults={sofa:'3 места',armchair:'Обычное',mattress:'Односпальный',chair:'Сиденье'};
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const query=new URLSearchParams(location.search);const requestedCategory=query.get('category');
  let category=['sofa','armchair','mattress','chair','other'].includes(requestedCategory)?requestedCategory:'sofa',variant=defaults[category]||'3 места',quantity=1,dirty=false,cart=read('myagko.local.cart.v1',[]),cartPage=null,previousCartTheme='light';
  if(!root||!scene||!tabs.length)return;
  scene.setAttribute('aria-busy','false');scene.querySelector('.loading-model')?.remove();scene.querySelector('.reset-wrap')?.remove();
  const preview=document.createElement('div');preview.className='local-preview';preview.innerHTML='<model-viewer class="local-furniture-model" camera-controls disable-pan interaction-prompt="none" shadow-intensity="0.75" exposure="1" environment-image="neutral" camera-orbit="25deg 70deg 105%" field-of-view="32deg" alt="3D-модель мебели"></model-view><img class="local-model-poster" alt="Превью мебели"><span class="local-model-status">Поверните модель мышью или пальцем</span>';scene.prepend(preview);
  const viewer=preview.querySelector('model-viewer'),modelStatus=preview.querySelector('.local-model-status'),modelPoster=preview.querySelector('.local-model-poster');
  viewer.addEventListener('load',()=>{modelPoster.style.display='none';modelStatus.textContent='Поверните модель мышью или пальцем'});
  viewer.addEventListener('error',()=>{modelPoster.style.display='block';modelStatus.textContent='Не удалось загрузить 3D-модель'});
  modelStatus.textContent='Загружаем 3D-модель…';
  const panel=document.querySelector('.configuration .panel'),title=panel.querySelector('h2'),fields=panel.querySelector('.configuration-fields');
  let segments=fields.querySelector('.segments');const countOut=fields.querySelector('output'),price=panel.querySelector('.price'),add=panel.querySelector('.configuration-action .button'),dirtyInput=fields.querySelector('input[type="checkbox"]');
  const rubles=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
  const unitCost=item=>item.category==='other'?null:Math.round(rates[item.category][item.variant]*(item.dirty?1+dirtyPercent/100:1));
  const subtotal=items=>items.reduce((sum,item)=>sum+(unitCost(item)||0)*item.quantity,0);
  const estimate=items=>Math.max(subtotal(items),items.some(x=>x.category!=='other')?minimumOrder:0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const quote=document.createElement('div');quote.className='local-toast';document.body.append(quote);
  function toast(text){quote.textContent=text;quote.classList.add('visible');setTimeout(()=>quote.classList.remove('visible'),2600)}
  function updateCart(){save('myagko.local.cart.v1',cart);const btn=document.querySelector('.cart-button');if(btn)btn.innerHTML='<span class="icon icon-cart" aria-hidden="true"></span>Заказ'+(cart.length?' <span class="cart-badge">'+cart.reduce((s,x)=>s+x.quantity,0)+'</span>':'')}
  function render(){
    tabs.forEach((b,i)=>{b.setAttribute('aria-selected',String(categories[i]===category));let mark=b.querySelector('.selected-category');if(categories[i]===category&&!mark){mark=document.createElement('span');mark.className='selected-category';b.prepend(mark)}else if(categories[i]!==category)mark?.remove()});
    title.textContent=names[category];preview.hidden=category==='other';if(category!=='other'){const model=preview.querySelector('model-viewer');modelStatus.textContent='Загружаем 3D-модель…';modelPoster.style.display='none';model.src='models/'+models[category];model.alt='3D-модель: '+names[category].toLowerCase();const poster=preview.querySelector('.local-model-poster');poster.src='posters/'+pics[category];poster.alt='Превью: '+names[category].toLowerCase()}
    if(category==='other'){if(segments)segments.hidden=true;if(!fields.querySelector('.local-description')){const l=document.createElement('label');l.className='field local-description';l.innerHTML='<span>Опишите мебель</span><input type="text" placeholder="Например, пуф или ковёр">';fields.prepend(l)}price.textContent='По запросу'}else{fields.querySelector('.local-description')?.remove();if(!segments){segments=document.createElement('div');segments.className='segments';segments.setAttribute('role','group');segments.setAttribute('aria-label','Вариант мебели');fields.prepend(segments)}segments.hidden=false;segments.innerHTML='';Object.entries(rates[category]).forEach(([label])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(variant===label));b.addEventListener('click',()=>{variant=label;render()});segments.append(b)});price.textContent=rubles(Math.round(rates[category][variant]*(dirty?1+dirtyPercent/100:1)*quantity))}
    countOut.textContent=quantity;dirtyInput.checked=dirty;const quantityButtons=fields.querySelectorAll('.stepper button');quantityButtons[0].disabled=quantity<=1;quantityButtons[1].disabled=quantity>=99;updateCart();
  }
  function modalShell(){document.querySelector('.local-modal')?.remove();const m=document.createElement('div');m.className='local-modal';m.innerHTML='<style>.local-modal{position:fixed;inset:0;z-index:999;background:#07090bd9;display:grid;place-items:center;padding:18px;overflow:auto}.local-dialog{width:min(900px,100%);max-height:min(92vh,1000px);overflow:auto;background:var(--surface,#1e252c);color:var(--ink,#f2f6fa);border:1px solid var(--glass-edge,#3a4e5b);border-radius:28px;padding:clamp(22px,4vw,44px);box-shadow:0 24px 90px #0008}.local-dialog h1{font-size:clamp(34px,6vw,58px);line-height:1.04;margin:14px 0 26px}.local-dialog h2{font-size:22px;margin:0 0 22px}.local-close{float:right;border:0;background:transparent;color:inherit;font-size:28px;cursor:pointer}.local-lines{display:grid;gap:12px}.local-line{display:flex;gap:18px;justify-content:space-between;align-items:center;padding:20px;border:1px solid var(--glass-edge,#3a4e5b);border-radius:20px}.local-muted{color:var(--muted,#a7b6c2)}.local-row{display:flex;justify-content:space-between;gap:18px;padding:12px 0}.local-total{border-top:1px solid var(--glass-edge,#3a4e5b);margin-top:10px;padding-top:20px;font-size:20px}.local-form{display:grid;gap:15px}.local-form label{display:grid;gap:7px}.local-form input,.local-form textarea{width:100%;padding:13px 14px;border-radius:12px;border:1px solid var(--glass-edge,#3a4e5b);background:var(--surface-2,#27333c);color:inherit;font:inherit}.local-form textarea{min-height:90px;resize:vertical}.local-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.local-actions .button{min-height:50px}.local-pill{display:inline-flex;padding:6px 10px;border-radius:99px;background:#216de533;color:#77adff;font-size:13px}.local-empty{padding:24px;border:1px dashed var(--glass-edge,#3a4e5b);border-radius:16px;color:var(--muted,#a7b6c2)}.local-check{display:flex!important;align-items:flex-start;gap:10px!important}.local-check input{width:auto}.local-order-card{padding:18px;border:1px solid var(--glass-edge,#3a4e5b);border-radius:16px;margin:12px 0}.cart-badge{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 5px;border-radius:50px;background:var(--accent,#216de5);color:white;font-size:12px}.local-modal button.link{cursor:pointer}.local-modal .button.secondary{background:transparent;color:inherit;border:1px solid var(--glass-edge,#3a4e5b)}@media(max-width:600px){.local-line{align-items:flex-start;flex-direction:column}.local-dialog{border-radius:20px}}</style><section class="local-dialog" role="dialog" aria-modal="true" aria-labelledby="local-title"><button class="local-close" aria-label="Закрыть">×</button><div class="local-content"></div></section>';document.body.append(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.local-close'))m.remove()});document.addEventListener('keydown',function closeOnEsc(e){if(e.key==='Escape'){m.remove();document.removeEventListener('keydown',closeOnEsc)}});return m}
  function closeCart(){
    if(!cartPage)return;
    cartPage.remove();cartPage=null;
    const app=document.querySelector('.app');
    app.querySelector('main')?.removeAttribute('hidden');
    app.querySelector('footer')?.removeAttribute('hidden');
    document.documentElement.dataset.theme=previousCartTheme;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function installCartStyles(){
    if(document.getElementById('local-cart-styles'))return;
    const style=document.createElement('style');style.id='local-cart-styles';style.textContent=`
      .local-cart-page{max-width:1480px;margin:0 auto;padding:clamp(32px,5vw,72px) clamp(22px,5.3vw,82px) 80px;color:#112e49}
      .local-cart-page *{box-sizing:border-box}
      .local-cart-back{display:inline-flex;align-items:center;gap:12px;border:0;background:none;color:#526a83;padding:0;font:inherit;font-size:18px;cursor:pointer}
      .local-cart-eyebrow{margin-top:70px;color:#526a83;font-size:17px}
      .local-cart-title{margin:18px 0 42px;font-size:clamp(42px,5vw,68px);line-height:1.03;letter-spacing:-.045em;color:#112e49}
      .local-cart-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.95fr);gap:clamp(24px,4vw,58px);align-items:start}
      .local-cart-list{display:grid;gap:22px}
      .local-cart-card,.local-cart-summary{background:#fff;border:1.5px solid #d8e3ef;border-radius:30px;box-shadow:0 2px 4px #19355308}
      .local-cart-card{padding:clamp(24px,3.3vw,44px)}
      .local-cart-cardtop{display:grid;grid-template-columns:74px 1fr auto;gap:22px;align-items:center}
      .local-cart-icon{width:74px;height:74px;border-radius:24px;background:#edf2f8;display:grid;place-items:center;color:#536c85}
      .local-cart-icon img{width:30px;height:30px;opacity:.68}
      .local-cart-name{font-size:clamp(19px,2vw,27px);font-weight:750;color:#142f49}
      .local-cart-price{font-size:clamp(20px,2.1vw,28px);white-space:nowrap;color:#142f49}
      .local-cart-cardbottom{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:44px 0 0 96px}
      .local-cart-stepper{height:72px;display:flex;align-items:center;gap:23px;padding:0 22px;border-radius:23px;background:#edf2f8;color:#163650;font-size:20px}
      .local-cart-stepper button{width:36px;height:36px;border:0;border-radius:50%;background:#173650;color:#fff;font-size:22px;line-height:1;cursor:pointer}
      .local-cart-stepper button:disabled{background:#a5b3c1;cursor:default}
      .local-cart-links{display:flex;gap:30px;align-items:center}
      .local-cart-link{border:0;background:none;padding:8px 0;color:#216de5;font:inherit;font-size:17px;cursor:pointer}
      .local-cart-link.remove{color:#d9535f}
      .local-cart-add{width:100%;min-height:94px;border:1.5px solid #d8e3ef;border-radius:28px;background:#fff;color:#15344f;font:inherit;font-size:21px;cursor:pointer}
      .local-cart-add span{display:inline-grid;place-items:center;width:38px;height:38px;margin-right:16px;border-radius:50%;background:#173650;color:#fff;font-size:26px;vertical-align:middle}
      .local-cart-summary{padding:clamp(28px,3vw,42px)}
      .local-cart-summary h2{margin:0 0 42px;font-size:clamp(21px,2vw,28px);color:#142f49}
      .local-cart-line{display:flex;justify-content:space-between;align-items:center;gap:18px;margin:0 0 28px;color:#253f59;font-size:18px}
      .local-cart-total{display:flex;justify-content:space-between;align-items:center;gap:18px;padding-top:30px;margin:38px 0 28px;border-top:1.5px solid #d8e3ef;color:#253f59;font-size:18px}
      .local-cart-total strong{font-size:clamp(34px,4vw,54px);font-weight:500;color:#142f49;white-space:nowrap}
      .local-cart-submit{width:100%;min-height:78px;border:0;border-radius:22px;background:#112f4c;color:#fff;font:inherit;font-size:20px;cursor:pointer}
      .local-cart-submit:disabled{opacity:.45;cursor:default}
      .local-cart-submit span{margin-left:18px;font-size:30px;vertical-align:-2px}
      .local-cart-note{text-align:center;color:#526a83;font-size:15px;line-height:1.5;margin:24px 0 0}
      .local-cart-empty{padding:36px;border:1.5px dashed #d8e3ef;border-radius:24px;color:#526a83;font-size:18px}
      .local-modal{background:#0d223833!important}.local-dialog{background:#fff!important;color:#142f49!important;border-color:#d8e3ef!important}.local-dialog .local-muted{color:#61768a!important}.local-form input,.local-form textarea{background:#f6f8fb!important;color:#142f49!important;border-color:#d8e3ef!important}.local-dialog .button.primary{background:#112f4c;color:#fff}.local-dialog .button.secondary{color:#142f49!important;border-color:#d8e3ef!important}
      @media(max-width:900px){.local-cart-grid{grid-template-columns:1fr}.local-cart-eyebrow{margin-top:48px}.local-cart-summary{order:2}}
      @media(max-width:560px){.local-cart-page{padding:28px 18px 54px}.local-cart-title{font-size:42px;margin-bottom:28px}.local-cart-card{padding:20px;border-radius:22px}.local-cart-cardtop{grid-template-columns:54px 1fr;gap:13px}.local-cart-icon{width:54px;height:54px;border-radius:17px}.local-cart-price{grid-column:2;font-size:20px}.local-cart-cardbottom{margin:25px 0 0;align-items:flex-start;flex-direction:column}.local-cart-stepper{height:58px}.local-cart-links{gap:22px}.local-cart-summary{padding:24px;border-radius:22px}.local-cart-summary h2{margin-bottom:28px}.local-cart-line{font-size:16px}.local-cart-total{font-size:16px}.local-cart-total strong{font-size:34px}.local-cart-submit{min-height:66px;font-size:17px}}
    `;document.head.append(style);
  }
  function openCart(){
    installCartStyles();
    const app=document.querySelector('.app');
    const header=app.querySelector('.header');
    if(!cartPage){
      previousCartTheme=document.documentElement.dataset.theme||'light';
      document.documentElement.dataset.theme='light';
      app.querySelector('main')?.setAttribute('hidden','');
      app.querySelector('footer')?.setAttribute('hidden','');
      cartPage=document.createElement('main');cartPage.className='local-cart-page';cartPage.id='main-content';header.insertAdjacentElement('afterend',cartPage);
    }
    const total=estimate(cart);
    const rows=cart.map((item,index)=>{
      const itemPrice=unitCost(item)?rubles(unitCost(item)*item.quantity):'По запросу';
      const variantText=item.category==='other'?(item.description||'По фото'):(item.variant||'');
      return `<article class="local-cart-card"><div class="local-cart-cardtop"><div class="local-cart-icon"><img src="icons/sofa.svg" alt=""></div><div class="local-cart-name">${esc(names[item.category])}${variantText?` · ${esc(variantText)}`:''}</div><strong class="local-cart-price">${itemPrice}</strong></div><div class="local-cart-cardbottom"><div class="local-cart-stepper"><button type="button" data-qty="-1" data-index="${index}" aria-label="Уменьшить количество" ${item.quantity<=1?'disabled':''}>−</button><span>${item.quantity}</span><button type="button" data-qty="1" data-index="${index}" aria-label="Увеличить количество">+</button></div><div class="local-cart-links"><button class="local-cart-link" data-edit="${index}">Изменить</button><button class="local-cart-link remove" data-remove="${index}">Удалить</button></div></div></article>`;
    }).join('');
    cartPage.innerHTML=`<button class="local-cart-back" data-back><span aria-hidden="true">◀</span> К выбору мебели</button><div class="local-cart-eyebrow">Ваш заказ</div><h1 class="local-cart-title">Всё, что освежим.</h1><div class="local-cart-grid"><section class="local-cart-list" aria-label="Предметы в заказе">${cart.length?rows:`<div class="local-cart-empty">В заказе пока пусто. Выберите мебель и добавьте её сюда.</div>`}<button class="local-cart-add" data-add><span>+</span>Добавить мебель</button></section><aside class="local-cart-summary"><h2>Стоимость заказа</h2><div class="local-cart-line"><span>Чистка по тарифам</span><strong>${rubles(subtotal(cart))}</strong></div><div class="local-cart-line"><span>Выезд по городу</span><strong>Бесплатно</strong></div><div class="local-cart-total"><span>Предварительно</span><strong>${rubles(total)}</strong></div><button class="local-cart-submit" data-checkout ${cart.length?'':'disabled'}>Оформить заявку <span aria-hidden="true">→</span></button><p class="local-cart-note">Итоговую цену и время подтвердим по телефону.</p></aside></div>`;
    cartPage.onclick=e=>{
      const q=e.target.closest('[data-qty]'),r=e.target.closest('[data-remove]'),edit=e.target.closest('[data-edit]');
      if(e.target.closest('[data-back]')||e.target.closest('[data-add]')){closeCart();return}
      if(q){const i=Number(q.dataset.index);cart[i].quantity=Math.max(1,Math.min(99,cart[i].quantity+Number(q.dataset.qty)));updateCart();openCart();return}
      if(r){cart.splice(Number(r.dataset.remove),1);updateCart();openCart();return}
      if(edit){const item=cart[Number(edit.dataset.edit)];category=item.category;variant=item.variant||defaults[category]||'';quantity=item.quantity;dirty=Boolean(item.dirty);closeCart();render();window.scrollTo({top:0,behavior:'smooth'});return}
      if(e.target.closest('[data-checkout]')){closeCart();openCheckout()}
    };
  }
  function openCheckout(){const m=modalShell(),c=m.querySelector('.local-content');if(!cart.length){m.remove();openCart();return}c.innerHTML='<div class="eyebrow">Заявка</div><h1 id="local-title">Куда приехать?</h1><div class="local-row"><span>Мебель и чистка</span><strong>'+rubles(subtotal(cart))+'</strong></div><div class="local-row"><span>Выезд по городу</span><strong>Бесплатно</strong></div><div class="local-row local-total"><span>Предварительно</span><strong>'+rubles(estimate(cart))+'</strong></div><form class="local-form" id="local-order-form"><label>Ваше имя<input name="name" autocomplete="name" required minlength="2" placeholder="Имя"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel" required minlength="10" placeholder="+7 ___ ___-__-__"></label><label>Адрес<input name="address" autocomplete="street-address" required minlength="5" placeholder="Улица, дом, квартира"></label><div class="local-row"><label style="flex:1">Удобная дата<input name="day" type="date"></label><label style="flex:1">Время<input name="time" type="time"></label></div><label>Комментарий<textarea name="comment" placeholder="Подъезд, этаж или пожелания"></textarea></label><label class="local-check"><input name="consent" type="checkbox" required><span>Согласен(на) на обработку данных для связи по этой заявке.</span></label><p class="local-muted">Заявка попадёт в общий кабинет. Мастер свяжется с вами, чтобы подтвердить цену и время.</p><div class="local-actions"><button type="button" class="button secondary" data-action="back">Назад</button><button type="submit" class="button primary">Отправить заявку →</button></div></form>';
    c.querySelector('[data-action="back"]').addEventListener('click',openCart,{once:true});c.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector('button[type=submit]');if(button.disabled)return;button.disabled=true;const f=new FormData(form);const payload={name:f.get('name'),phone:f.get('phone'),address:f.get('address'),day:f.get('day'),time:f.get('time'),comment:f.get('comment'),items:cart,city:false,consent:f.get('consent')==='on'};try{const response=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Не удалось отправить заявку.');cart=[];updateCart();openConfirmation(result.order)}catch(error){toast(error.message||'Сервис заявок пока недоступен. Попробуйте позже.');button.disabled=false}})
  }
  function openConfirmation(order){const m=modalShell(),c=m.querySelector('.local-content');c.innerHTML='<div class="eyebrow">Заявка оформлена</div><h1 id="local-title">Спасибо, '+esc(order.name)+'!</h1><p>Номер заявки <span class="local-pill">'+esc(order.id)+'</span></p><div class="local-order-card"><div class="local-row"><span>Предварительная стоимость</span><strong>'+rubles(order.total)+'</strong></div><p class="local-muted">Мы получили заявку. Мастер свяжется с вами, чтобы подтвердить время и итоговую цену.</p></div><div class="local-actions"><button class="button primary" data-action="home">Вернуться к сайту</button></div>';c.querySelector('[data-action="home"]').addEventListener('click',()=>{m.remove();window.scrollTo({top:0,behavior:'smooth'})})}
  const requestedVariant=query.get('variant');const variantAliases={two:'2 места',three:'3 места',corner:'Угловой',standard:'Обычное',recliner:'Реклайнер',single:'Односпальный',double:'Двуспальный',seat:'Сиденье',back:'Со спинкой'};if(requestedVariant&&category!=='other')variant=variantAliases[requestedVariant]||requestedVariant;
  tabs.forEach((b,i)=>b.addEventListener('click',()=>{category=categories[i];variant=defaults[category]||'';render()}));
  fetch('/api/settings').then(r=>r.ok?r.json():null).then(settings=>{if(!settings)return;minimumOrder=Number(settings.minimum)||0;dirtyPercent=Number(settings.dirtPercent)||0;for(const [key,value] of Object.entries(settings.prices||{})){const [group,label]=key.split('|');if(rates[group]&&Number.isFinite(Number(value)))rates[group][label]=Number(value)}render()}).catch(()=>{});
  dirtyInput.addEventListener('change',()=>{dirty=dirtyInput.checked;render()});fields.querySelectorAll('.stepper button').forEach((b,i)=>b.addEventListener('click',()=>{quantity=Math.max(1,Math.min(99,quantity+(i?1:-1)));render()}));
  add.addEventListener('click',()=>{let description='';if(category==='other'){description=fields.querySelector('.local-description input').value.trim();if(description.length<3){fields.querySelector('.local-description input').focus();return}}cart.push({category,variant,quantity,dirty,description});updateCart();toast('Добавлено в заказ');});
  document.querySelector('.cart-button')?.addEventListener('click',openCart);
  document.querySelector('.theme-toggle')?.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'light':'dark';try{localStorage.setItem('myagko.v1.theme',JSON.stringify(dark?'light':'dark'))}catch{};document.querySelector('.theme-toggle').textContent=dark?'Тёмная тема':'Светлая тема'});
  document.querySelector('.install button')?.addEventListener('click',()=>toast('Установка приложения доступна на опубликованном сайте'));
  render();
})();
