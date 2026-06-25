/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          50: '#EFF6FF',
          100: '#DBEAFE',
        },
        surface: '#F8FAFC',
        sidebar: {
          bg: '#0F172A',
          text: '#94A3B8',
          active: '#2563EB',
          hover: '#1E293B',
        },
        brand: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
