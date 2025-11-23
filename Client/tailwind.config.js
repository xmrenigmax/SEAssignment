/** @type {import('tailwindcss').Config} */
export default {
  // content: scans these files for class names to generate CSS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Maps Tailwind classes to your CSS variables for Theme Switching
      colors: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        accent: 'var(--accent)',
        border: 'var(--border)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)'
        }
      },
      // Adds specific font stack for the "Marcus" persona
      fontFamily: {
        serif: ['Times New Roman', 'Times', 'serif'],
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}