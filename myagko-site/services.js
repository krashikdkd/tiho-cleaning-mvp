(() => {
  const cards = [...document.querySelectorAll('.service-card')];
  const categories = ['sofa', 'armchair', 'mattress', 'chair'];
  const variants = ['two', 'standard', 'single', 'seat'];
  const format = (n) => new Intl.NumberFormat('ru-RU').format(Number(n) || 0) + ' ₽';
  cards.forEach((card, i) => {
    if (categories[i]) card.href = `./index.html?category=${categories[i]}&variant=${variants[i]}`;
  });
  fetch('/api/settings').then((response) => response.ok ? response.json() : null).then((settings) => {
    if (!settings) return;
    const minimums = [settings.prices['sofa|2 места'], settings.prices['armchair|Обычное'], settings.prices['mattress|Односпальный'], settings.prices['chair|Сиденье']];
    cards.forEach((card, i) => { const price = card.querySelector('.service-card-action .price'); if (price && minimums[i] != null) price.textContent = `От ${format(minimums[i])}`; });
    const terms = document.querySelectorAll('.service-conditions .row .price');
    if (terms[0]) terms[0].textContent = format(settings.minimum);
    if (terms[1]) terms[1].textContent = `От ${format(settings.travel)}`;
  }).catch(() => {});
})();
