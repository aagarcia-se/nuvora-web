import { useEffect, useState } from 'react';
type Theme = 'light' | 'dark' | 'system';
export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const value = localStorage.getItem('nuvora-theme');
      return value === 'light' || value === 'dark' ? value : 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        theme === 'dark' || (theme === 'system' && media.matches),
      );
    apply();
    try {
      localStorage.setItem('nuvora-theme', theme);
    } catch {
      /* Session-only preference. */
    }
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      Tema
      <select
        className="input w-auto"
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
      >
        <option value="system">Sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>
    </label>
  );
}
