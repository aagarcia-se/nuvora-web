import { useEffect, useState } from 'react';
import { Icon } from '@/shared/ui/components/Icon';
import { darkThemeColor, lightThemeColor } from '@/shared/config/brand';
type Theme = 'light' | 'dark' | 'system';

function applyThemeColor(dark: boolean) {
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('#theme-color')?.setAttribute('content', dark ? darkThemeColor : lightThemeColor);
  document.querySelector('#apple-status-bar-style')?.setAttribute('content', dark ? 'black-translucent' : 'default');
}

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
      applyThemeColor(dark);
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
    <div role="group" aria-label="Apariencia" className="flex gap-1 rounded-2xl border border-line bg-surface p-1">
      {(['light', 'dark'] as const).map(value => <button key={value} type="button"
        aria-label={value === 'light' ? 'Modo claro' : 'Modo oscuro'}
        aria-pressed={(theme === 'system' ? (systemDark ? 'dark' : 'light') : theme) === value}
        onClick={() => setTheme(value)} className="theme-option flex min-h-12 min-w-12 items-center justify-center rounded-xl text-muted">
        <Icon name={value === 'light' ? 'sun' : 'moon'} />
      </button>)}
    </div>
  );
}
