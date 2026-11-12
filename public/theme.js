/* global localStorage, matchMedia, document */
// Runs before paint; preference is the only app-owned persisted value.
(() => {
  let preference = 'system';
  try {
    preference = localStorage.getItem('nuvora-theme') || 'system';
  } catch {
    /* Storage may be unavailable. */
  }
  const dark =
    preference === 'dark' ||
    (preference !== 'light' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  const themeColor = document.querySelector('#theme-color');
  if (themeColor) themeColor.setAttribute('content', dark ? '#111715' : '#F7F8F6');
})();
