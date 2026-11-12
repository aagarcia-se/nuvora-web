import type { Config } from 'tailwindcss';
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 600: 'rgb(var(--color-brand) / <alpha-value>)' },
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        navigation: 'rgb(var(--color-nav) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-soft': 'var(--accent-bg)',
        success: 'var(--success)',
        'success-soft': 'var(--success-bg)',
        warning: 'var(--warning)',
        'warning-soft': 'var(--warning-bg)',
        info: 'var(--info)',
        'info-soft': 'var(--info-bg)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-bg)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      screens: { xs: '380px' },
    },
  },
  plugins: [],
} satisfies Config;
