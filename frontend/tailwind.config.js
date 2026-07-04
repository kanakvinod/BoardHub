/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f6fb",
          100: "#e8ecf6",
          200: "#cbd6ec",
          300: "#a2b6dc",
          400: "#7190c8",
          500: "#4e71b2",
          600: "#3c5896",
          700: "#32477b",
          800: "#2c3c67",
          900: "#293456",
          950: "#1c223a",
        },
      },
    },
  },
  plugins: [],
};
