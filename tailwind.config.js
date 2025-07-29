/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#2DE2C5', // teal/cyan
        primary: '#111827',    // dark gray background
        accent: '#FFFFFF',     // white
      },
    },
  },
  plugins: [],
} 