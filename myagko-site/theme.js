(() => {
  const key = 'myagko.v1.theme';
  const read = () => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || 'light'; }
    catch { return 'light'; }
  };
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    const button = document.querySelector('.theme-toggle');
    if (button) button.textContent = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  };
  apply(read());
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    apply(next);
  });
})();
