/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8A00',
          dark: '#FF3C00',
        },
        background: '#F9F9F9',
        panel: '#EAEAEA',
        text: '#1F1F1F',
      },
      backgroundImage: {
        'orange-gradient': 'linear-gradient(135deg, #FF8A00 0%, #FF3C00 100%)',
      },
    },
  },
  plugins: [],
};
