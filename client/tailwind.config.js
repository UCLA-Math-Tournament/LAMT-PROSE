/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- Add this line right here!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ucla-blue': '#2774AE',
        'ucla-gold': '#FFD100',
        'ucla-dark-blue': '#005587',
        'ucla-light-blue': '#8BB8E8',
      }
    },
  },
  plugins: [],
}
