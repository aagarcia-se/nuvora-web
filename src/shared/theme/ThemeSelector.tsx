import { useEffect, useState } from 'react';
import { Icon } from '@/shared/ui/components/Icon';
import { applyThemeColor } from './themeMeta';
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
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      setSystemDark(media.matches);
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      // Keep status/navigation chrome dark until the auth bootstrap has
      // resolved and the initial splash has been removed.
      const splash = document.querySelector<HTMLElement>('#initial-splash');
      if (!splash || splash.hidden) applyThemeColor(dark);
    };
    apply();
    try {
      if (theme !== 'system') localStorage.setItem('nuvora-theme', theme);
    } catch {
      /* Session-only preference. */
    }
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  return (
    <div role="group" aria-label="Apariencia" className="theme-switch">
      {(['light', 'dark'] as const).map(value => <button key={value} type="button"
        aria-label={value === 'light' ? 'Modo claro' : 'Modo oscuro'}
        aria-pressed={(theme === 'system' ? (systemDark ? 'dark' : 'light') : theme) === value}
        onClick={() => setTheme(value)} className="theme-option flex items-center justify-center text-muted">
        <Icon name={value === 'light' ? 'sun' : 'moon'} />
      </button>)}
    </div>
  );
}
