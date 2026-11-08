/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        saffron: { 50: '#FFF4E5', 100: '#FFE4BF', 200: '#FFCB85', 300: '#FFB04D', 400: '#FF9933', 500: '#F27F0C', 600: '#D96A06', 700: '#B35108' },
        gold: { 300: '#EBCB6B', 400: '#E0B440', 500: '#D4A017', 600: '#B3830F' },
        maroon: { 50: '#FBEFEF', 100: '#F2D6D6', 600: '#8A2A2A', 700: '#6B1D1D', 800: '#4F1414', 900: '#360D0D' },
        cream: { 50: '#FFFCF5', 100: '#FFF8E7', 200: '#FBEFCF' },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

