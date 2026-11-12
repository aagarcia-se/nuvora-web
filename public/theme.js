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
  const root = document.documentElement;
  const logoColor = dark ? '#D5F454' : '#17211D';
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  root.style.setProperty('--initial-splash-background', dark ? '#111715' : '#F7F8F6');
  root.style.setProperty('--initial-splash-logo', logoColor);
  // The parser has already created the real F5 splash at this point. Set its
  // paint directly so an SVG attribute or a stale cascade cannot win.
  document.querySelector('#initial-splash path')?.style.setProperty('fill', logoColor, 'important');
  document.querySelector('#theme-color')?.setAttribute(
    'content',
    dark ? '#111715' : '#F7F8F6',
  );
})();
