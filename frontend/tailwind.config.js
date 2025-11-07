/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1E1F22',
        'dark-panel': '#232428',
        'dark-border': '#2E2F33',
        'dark-card': '#2F3034',
        'dark-muted': '#9E9EA1',
        'trello-purple': '#4C3F91',
        'dark-text': '#E1E2E5',
      },
    },
  },
  plugins: [],
};
