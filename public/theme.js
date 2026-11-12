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
  // The initial document and browser chrome are dark regardless of the app
  // preference. The selected scheme is applied when React removes the splash.
  document.documentElement.style.colorScheme = 'dark';
  // Browser chrome stays dark while the initial splash is visible. React
  // applies the selected status-bar color after initialization.
})();
