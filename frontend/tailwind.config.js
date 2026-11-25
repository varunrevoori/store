/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sky2: '#3598CB',
        hot: '#D13095',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        maroon: '#22101b',
        violet: '#7B5CFF',
        orange: '#FF8A4C',
        muted: 'var(--text-muted)',
        secondary: 'var(--text-secondary)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};