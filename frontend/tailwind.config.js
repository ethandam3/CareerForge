/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#0f5132',
          900: '#0d1a10',
          950: '#060f08',
        }
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-headings': '#e2e8f0',
            '--tw-prose-bold': '#f1f5f9',
            '--tw-prose-links': '#4ade80',
            '--tw-prose-bullets': '#4ade80',
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
