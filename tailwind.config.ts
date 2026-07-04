/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        // Obsidian Design Tokens
        appBackground: "#0f172a",
        cardBackground: "#1e293b",
        primary: "#F59E0B",
        secondary: "#009B77",
        tertiary: "#7F77DD",
        surface: "#dae2fd",
        glassBorder: "rgba(255,255,255,0.06)",
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "2rem",
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
};
