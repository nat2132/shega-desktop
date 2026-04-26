/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retail: {
          orange: '#FF4D00',
          black: '#1A1B1F',
          gray: {
            100: '#F5F6F8',
            200: '#F1F1F4',
            300: '#A1A1AA',
            400: '#71717A'
          }
        }
      },
      borderRadius: {
        '4xl': '2.5rem',
        '5xl': '3rem',
      }
    },
  },
  plugins: [],
}
