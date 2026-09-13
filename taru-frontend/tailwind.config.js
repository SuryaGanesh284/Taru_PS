/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4dba8',
          300: '#ecc26e',
          400: '#e3a43c',
          500: '#d4891f',
          600: '#b86e16',
          700: '#935314',
          800: '#784316',
          900: '#633916',
          950: '#371d08',
        },
        earth: {
          50:  '#f7f3ee',
          100: '#ede3d5',
          200: '#d9c5aa',
          300: '#c2a078',
          400: '#ad7f52',
          500: '#9e6b3e',
          600: '#885535',
          700: '#6e412c',
          800: '#5b3628',
          900: '#4d2f24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
