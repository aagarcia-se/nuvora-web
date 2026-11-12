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
  const themeColor = document.querySelector('#theme-color');
  if (themeColor) themeColor.setAttribute('content', dark ? '#171A19' : '#F4F2ED');
})();
