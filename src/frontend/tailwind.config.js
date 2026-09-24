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
        // Gentelella Signature Colors
        gentelella: {
          sidebar: '#2A3F54',
          'sidebar-hover': '#334a5e',
          'sidebar-active': '#3E5367',
          'sidebar-border': '#1ABB9C',
          green: '#1ABB9C',
          'green-dark': '#169F85',
          blue: '#3498DB',
          'blue-dark': '#2980B9',
          orange: '#F39C12',
          red: '#E74C3C',
          'red-dark': '#C0392B',
          purple: '#9B59B6',
          body: '#F7F7F7',
          panel: '#FFFFFF',
          border: '#E6E9ED',
          'top-nav': '#EDEDED',
          text: '#73879C',
          heading: '#2A3F54',
          muted: '#999999',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#1ABB9C',
          600: '#169F85',
          700: '#117A65',
          800: '#0E6251',
          900: '#2A3F54',
        },
        canvas: '#F7F7F7',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        dark: {
          950: '#121921',
          900: '#161F28',
          850: '#1A242F',
          800: '#1D2B36',
          750: '#223240',
          700: '#2A3F54',
          600: '#3E5367',
        },
        glass: {
          l1: 'var(--glass-l1-bg)',
          l2: 'var(--glass-l2-bg)',
          l3: 'var(--glass-l3-bg)',
          l4: 'var(--glass-l4-bg)',
          cyan: 'rgba(26, 187, 156, 0.16)',
          blue: 'rgba(52, 152, 219, 0.16)',
        },
        accent: {
          50: '#E8F8F5',
          100: '#D1F2EB',
          400: '#48C9B0',
          500: '#1ABB9C',
          600: '#169F85',
          700: '#117A65',
        },
        status: {
          online: '#1ABB9C',
          offline: '#95A5A6',
          syncing: '#3498DB',
          error: '#E74C3C',
          noop: '#16A085',
          pending: '#F39C12',
        }
      },
      boxShadow: {
        'x-panel': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'x-panel-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'gentelella-tile': '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      borderColor: {
        'gentelella-panel': '#E6E9ED',
        'gentelella-border': '#D9DEE4',
      }
    },
  },
  plugins: [],
}
