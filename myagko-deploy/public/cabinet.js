(() => {
  const read=()=>{try{return JSON.parse(localStorage.getItem('myagko.local.orders.v1')||'[]')}catch{return[]}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
  const fmtDate=s=>{try{return new Date(s).toLocaleString('ru-RU',{dateStyle:'medium',timeStyle:'short'})}catch{return s}};
  const titles={sofa:'Диван',armchair:'Кресло',mattress:'Матрас',chair:'Стул',other:'Другое'};
  function render(){
    const orders=read();
    document.getElementById('all-count').textContent=orders.length;
    document.getElementById('new-count').textContent=orders.filter(o=>o.status==='Новая заявка').length;
    document.getElementById('active-count').textContent=orders.filter(o=>o.status==='В работе'||o.status==='Подтверждена').length;
    const host=document.getElementById('orders');
    if(!orders.length){host.innerHTML='<div class="cab-empty">Заявок пока нет. Добавьте мебель в заказ и пройдите оформление.</div>';return}
    host.innerHTML=orders.map((o,i)=>'<article class="cab-order"><div class="cab-order-top"><div><h3>'+esc(o.name)+' <span class="cab-muted">· '+esc(o.phone)+'</span></h3><div class="cab-id">Заявка '+esc(o.id)+' · '+esc(fmtDate(o.createdAt))+'</div></div><div class="cab-total">'+fmt(o.total||0)+'</div></div><div class="cab-details"><div><b>Адрес</b>'+esc(o.address)+'</div><div><b>Дата и время</b>'+esc([o.day,o.time].filter(Boolean).join(' · ')||'По согласованию')+'</div><div><b>Комментарий</b>'+esc(o.comment||'—')+'</div><div><b>Состав заказа</b><ul class="cab-items">'+(o.items||[]).map(x=>'<li>'+esc(titles[x.category]||x.category)+(x.variant?' · '+esc(x.variant):'')+' × '+esc(x.quantity)+(x.dirty?' · сильные загрязнения':'')+(x.description?' · '+esc(x.description):'')+'</li>').join('')+'</ul></div></div><div class="cab-status"><label>Статус <select data-status="'+i+'"><option'+(o.status==='Новая заявка'?' selected':'')+'>Новая заявка</option><option'+(o.status==='Подтверждена'?' selected':'')+'>Подтверждена</option><option'+(o.status==='В работе'?' selected':'')+'>В работе</option><option'+(o.status==='Выполнена'?' selected':'')+'>Выполнена</option><option'+(o.status==='Отменена'?' selected':'')+'>Отменена</option></select></label><button class="cab-button primary" data-save="'+i+'">Сохранить статус</button><span class="cab-muted" data-saved="'+i+'"></span></div></article>').join('');
    host.querySelectorAll('[data-save]').forEach(btn=>btn.addEventListener('click',()=>{const i=+btn.dataset.save,current=read();current[i].status=host.querySelector('[data-status="'+i+'"]').value;localStorage.setItem('myagko.local.orders.v1',JSON.stringify(current));render();const note=document.querySelector('[data-saved="'+i+'"]');if(note)note.textContent='Сохранено'}));
  }
  document.getElementById('refresh').addEventListener('click',render);render();
})();
