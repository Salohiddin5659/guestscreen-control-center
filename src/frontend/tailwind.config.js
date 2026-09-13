/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4361EE',
          600: '#3751D8',
          700: '#2B3EB0',
          800: '#1E2B88',
          900: '#121B60',
        },
        canvas: '#F4F5F7',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        dark: {
          950: '#070b12',
          900: '#0c121e',
          850: '#111927',
          800: '#162235',
          750: '#1c2b42',
          700: '#243450',
          600: '#334155',
        },
        accent: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          400: '#60A5FA',
          500: '#4361EE',
          600: '#3751D8',
          700: '#1D4ED8',
        },
        status: {
          online: '#10b981',
          offline: '#94a3b8',
          syncing: '#3b82f6',
          error: '#ef4444',
          noop: '#06b6d4',
          pending: '#8b5cf6',
        }
      }
    },
  },
  plugins: [],
}
