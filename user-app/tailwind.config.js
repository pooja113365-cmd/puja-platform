/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        saffron: { 50: '#FFF4E5', 100: '#FFE4BF', 200: '#FFCB85', 400: '#FF9933', 500: '#F27F0C', 600: '#D96A06', 700: '#B35108' },
        gold: { 300: '#EBCB6B', 500: '#D4A017', 600: '#B3830F' },
        maroon: { 50: '#FBEFEF', 600: '#8A2A2A', 700: '#6B1D1D', 800: '#4F1414', 900: '#360D0D' },
        cream: { 50: '#FFFCF5', 100: '#FFF8E7', 200: '#FBEFCF' },
      },
    },
  },
  plugins: [],
};

