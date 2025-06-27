/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ← to jest KLUCZOWE
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
        'flip-in': 'flipIn 0.6s ease-out forwards', // ✅ nowa animacja flip
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
      },
      transformOrigin: {
        center: 'center', // ← obrót wokół środka
      },
    },
  },
  plugins: [],
};
