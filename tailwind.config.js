/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          900: "#0b0b0d",
          700: "#1d1d1f",
          500: "#6e6e73",
          300: "#a1a1a6",
          100: "#d2d2d7",
        },
        canvas: "#fbfbfd",
        accent: {
          DEFAULT: "#0071e3",
          hover: "#0077ed",
          soft: "#e8f1ff",
        },
      },
      borderRadius: {
        xl2: "20px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        soft: "0 1px 3px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)",
        ring: "0 0 0 4px rgba(0,113,227,0.15)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 400ms cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};
