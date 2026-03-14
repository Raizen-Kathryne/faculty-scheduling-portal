/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Ensure proper min-heights for touch targets
      minHeight: {
        'touch': '44px', // iOS minimum touch target
      },
      minWidth: {
        'touch': '44px',
      }
    }
  },
  plugins: [],
}