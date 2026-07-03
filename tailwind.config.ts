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
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Backgrounds (sesuai spec)
        appBackground: "#0f172a", // surface
        cardBackground: "#1e293b", // surface-container
        cardGlow: "rgba(255, 255, 255, 0.06)", // border ultra-thin

        // Palette utama
        primary: "#F59E0B", // Nusantara Gold (CTA, active states)
        secondary: "#009B77", // Emerald Green (growth, positive metrics)
        tertiary: "#7F77DD", // System Indigo (AI insights)

        // Variasi
        onPrimary: "#0f172a", // teks di atas primary
        onSecondary: "#ffffff",
        onTertiary: "#ffffff",

        // Status indicator
        success: "#009B77",
        warning: "#F59E0B",
        danger: "#E24B4A",

        // Glassmorphism
        glassBg: "#1e293b", // opacity 80% + backdrop-blur
        glassBorder: "rgba(255, 255, 255, 0.06)",
      },
      fontSize: {
        "display-lg": [
          "36px",
          { lineHeight: "44px", letterSpacing: "-0.02em" },
        ],
        "stat-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em" }],
        "headline-md": [
          "24px",
          { lineHeight: "32px", letterSpacing: "-0.01em" },
        ],
        "body-base": ["14px", { lineHeight: "22px" }],
        "body-medium": ["14px", { lineHeight: "22px", fontWeight: "500" }],
        "body-bold": ["14px", { lineHeight: "22px", fontWeight: "600" }],
        "label-caps": ["11px", { lineHeight: "16px", letterSpacing: "0.08em" }],
        "label-small": ["11px", { lineHeight: "16px" }],
      },
      spacing: {
        // base = 4px, dll.
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        gutter: "16px",
        sidebar: "250px",
        topbar: "64px",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        glass: "0 4px 20px rgba(0, 0, 0, 0.15)",
        "glass-hover": "0 6px 28px rgba(0, 0, 0, 0.18)",
      },
      backdropBlur: {
        glass: "12px",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #F59E0B, #D97706)",
        "gradient-secondary": "linear-gradient(135deg, #009B77, #007A5E)",
      },
    },
  },
  plugins: [],
};
