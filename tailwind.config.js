/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  darkMode: 'class', // ← tryb ciemny
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        handwriting: ['"Great Vibes"', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'flip-in': 'flipIn 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        flipIn: {
          '0%': { transform: 'rotateY(90deg)', opacity: 0 },
          '100%': { transform: 'rotateY(0deg)', opacity: 1 },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 0 rgba(0,255,150,0.4)',
          },
          '50%': {
            boxShadow: '0 0 15px rgba(0,255,150,0.6)',
          },
        },
      },
      transformOrigin: {
        center: 'center',
      },
    },
  },
  plugins: [
    require('tailwindcss-neumorphism'),
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.ios-icon': {
          '@apply rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(0,255,150,0.6)]':
            {},
        },
      });
    }),
  ],
};
