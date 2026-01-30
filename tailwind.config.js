/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tikin: {
          red: '#FF3333',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}
