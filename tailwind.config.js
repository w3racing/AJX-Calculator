/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        ios: {
          gray: {
            1: '#8e8e93',
            2: '#636366',
            3: '#48484a',
            4: '#3a3a3c',
            5: '#2c2c2e',
            6: '#1c1c1e',
          },
          blue: '#0a84ff',
          green: '#30d158',
          red: '#ff453a',
          fill: 'rgba(120,120,128,0.36)',
        }
      },
      borderRadius: {
        'ios': '12px',
        'ios-lg': '14px',
      },
      safeArea: {
        top: 'env(safe-area-inset-top)',
        bottom: 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
