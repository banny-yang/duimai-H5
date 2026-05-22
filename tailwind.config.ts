import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#06b6d4",
          dark: "#0891b2",
          deeper: "#0e7490",
          surface: "#f0f9fa",
          glow: "#f4fbfb",
        },
        secondary: {
          DEFAULT: "#64748b",
          border: "#e2e8f0",
          bg: "#f8fafc",
        },
        ink: "#1a1a1a",
        alert: {
          DEFAULT: "#ff3b30",
          dark: "#d32f2f",
        },
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      boxShadow: {
        "primary-sm": "0 2px 8px rgba(6, 182, 212, 0.28)",
        "alert-glow": "0 10px 28px rgba(211, 47, 47, 0.4), 0 0 20px rgba(255, 59, 48, 0.25)",
      },
      animation: {
        "sos-breathe": "sos-breathe 2.2s ease-in-out infinite",
      },
      keyframes: {
        "sos-breathe": {
          "0%, 100%": {
            boxShadow:
              "0 10px 28px rgba(211, 47, 47, 0.4), 0 0 0 0 rgba(255, 59, 48, 0.35)",
          },
          "50%": {
            boxShadow:
              "0 12px 32px rgba(211, 47, 47, 0.5), 0 0 22px 6px rgba(255, 59, 48, 0.22)",
          },
        },
      },
    },
  },
  plugins: [],
};
