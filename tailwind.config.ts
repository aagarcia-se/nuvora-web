import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de marca — se usa en toda la app (claro y oscuro),
        // no solo en dark mode, para que la identidad sea consistente.
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        // Color separado para errores/estados de peligro — antes se
        // podía reusar un "red" genérico porque brand era azul, pero
        // ahora que brand es rojizo, un token propio evita confusión
        // visual entre "marca" y "error".
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Mismo motivo que danger: brand ya no sirve como "todo bien"
        // porque es rojizo, así que success necesita su propio token
        // para que un mensaje de éxito no se confunda visualmente con
        // la marca o con un error.
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Tokens semánticos: mismo nombre de clase en toda la app,
        // el VALOR cambia solo con la clase "dark" en <html> (ver
        // globals.css y src/shared/theme/useTheme.ts). Así cada
        // componente se escribe una sola vez y funciona en ambos temas.
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
      },
      boxShadow: {
        brand: '0 8px 24px -8px rgb(244 63 94 / 0.45)',
      },
      keyframes: {
        'logo-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'logo-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(244 63 94 / 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgb(244 63 94 / 0)' },
        },
      },
      animation: {
        'logo-in': 'logo-in 0.5s ease-out',
        'logo-glow': 'logo-glow 2.4s ease-in-out infinite',
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
      screens: {
        xs: '380px',
      },
    },
  },
  plugins: [],
} satisfies Config;
