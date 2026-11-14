/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0F19',
          card: '#111827',
          cardHover: '#1F2937',
          border: '#374151',
          accent: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          muted: '#9CA3AF'
        }
      }
    },
  },
  plugins: [],
}
