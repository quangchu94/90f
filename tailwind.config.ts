import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#08131d',
          surface: '#101f31',
          elevated: '#13263b',
          border: '#263f5c',
          text: '#f8fafc',
          secondary: '#9fb2cc',
          muted: '#63809f',
          accent: '#ff6148',
          amber: '#ffb31a',
          live: '#22c55e',
          danger: '#ef4444'
        }
      },
      boxShadow: {
        soft: '0 18px 60px rgba(0, 0, 0, 0.24)'
      }
    }
  },
  plugins: []
} satisfies Config;
