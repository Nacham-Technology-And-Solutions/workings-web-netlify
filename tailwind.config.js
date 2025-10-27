/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'audiowide': ['Audiowide', 'cursive'],
        'exo': ['Exo', 'sans-serif'],
        'sans': ['Exo', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2d2e2e',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#2d2e2e',
          950: '#1a1b1b',
        },
        secondary: {
          DEFAULT: '#8a9ea2',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#8a9ea2',
          600: '#6d7a7e',
          700: '#475569',
          800: '#334155',
          900: '#1e293b',
          950: '#0f172a',
        },
        main: '#ffffff',
        background: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f3f4f6',
        },
        text: {
          primary: '#2d2e2e',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
          inverse: '#ffffff',
        },
        border: {
          DEFAULT: '#e5e7eb',
          secondary: '#d1d5db',
          focus: '#2d2e2e',
        },
      },
    },
  },
  plugins: [],
}
