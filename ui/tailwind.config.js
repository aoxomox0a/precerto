/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'patient-blue': '#0066cc',
        'doctor-green': '#00aa00',
      }
    },
  },
  plugins: [],
}
