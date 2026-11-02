/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#111827',
        'surface-card': '#161f33',
        'surface-border': '#1e293b',
        accent: {
          DEFAULT: '#38bdf8',
          glow: '#0ea5e9',
        },
        danger: {
          DEFAULT: '#ef4444',
          glow: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.7))' },
          '50%': { opacity: 0.85, filter: 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.9))' },
        },
      },
    },
  },
  plugins: [],
};
