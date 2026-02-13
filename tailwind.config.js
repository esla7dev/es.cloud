/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8f0fe',
          100: '#c5dafc',
          200: '#9ec1fa',
          300: '#74a7f7',
          400: '#4e91f5',
          500: '#2979FF',
          600: '#1565e0',
          700: '#0d47c2',
          800: '#0a3a9e',
          900: '#0D1B3E',
          950: '#080f24',
        },
        silver: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        navy: {
          50: '#e6eaf2',
          100: '#c2cce0',
          200: '#9aacc9',
          300: '#728db3',
          400: '#4e6e9d',
          500: '#2a4f87',
          600: '#1d3d6f',
          700: '#132c57',
          800: '#0D1B3E',
          900: '#080f24',
        },
      },
      animation: {
        'blob': 'blob 8s ease-in-out infinite',
        'gradient': 'gradientShift 8s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'hero-pattern': 'radial-gradient(ellipse at 30% 50%, rgba(41, 121, 255, 0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
