/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy
        neon: '#7CFF6B',
        ink: '#050816',
        panel: '#0C1222',
        // Trading Dashboard Palette
        bg:        '#08091A',
        's1':      '#0F1625',
        's2':      '#162035',
        's3':      '#1E2A42',
        volt:      '#7B61FF',
        'volt-dim':'#4C3A99',
        monad:     '#22D3EE',
        profit:    '#00C087',
        loss:      '#FF4757',
        warn:      '#FFB547',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'material': '28px',
        'chip': '8px',
      },
      boxShadow: {
        'card': '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-top': '0 8px 48px rgba(123,97,255,0.18), 0 0 0 1px rgba(123,97,255,0.12)',
        'fab': '0 6px 20px rgba(123,97,255,0.45)',
        'nav': '0 -1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
};
