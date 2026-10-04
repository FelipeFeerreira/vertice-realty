import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF8F4",
        ink: {
          DEFAULT: "#1C1B18",
          soft: "#4A463F",
          muted: "#7A7368",
        },
        line: "#E6E0D4",
        champagne: {
          DEFAULT: "#EFE9DD",
          deep: "#E2D8C6",
        },
        brass: {
          DEFAULT: "#8F744B",
          dark: "#77603D",
          light: "#B49A6E",
        },
        pine: {
          DEFAULT: "#33513F",
          dark: "#27402F",
        },
        hot: "#B4432F",
        warm: "#B98A2F",
        nurture: "#5F7A93",
        success: "#3E6B4F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      maxWidth: {
        site: "1200px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 27, 24, 0.05), 0 8px 24px -12px rgba(28, 27, 24, 0.12)",
        lift: "0 2px 4px rgba(28, 27, 24, 0.06), 0 16px 40px -16px rgba(28, 27, 24, 0.2)",
        chat: "0 12px 48px -12px rgba(28, 27, 24, 0.28)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "typing-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "flow-dot": {
          "0%": { top: "0%", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        "typing-bounce": "typing-bounce 1.2s infinite ease-in-out",
        "flow-dot": "flow-dot 2.8s linear infinite",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
