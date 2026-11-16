import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF6B00",
          "orange-hover": "#E05E00",
          "orange-light": "#FFF3EB",
          "orange-glow": "rgba(255, 107, 0, 0.15)",
        },
        dark: {
          bg: "#0A0A0A",
          surface: "#121212",
          card: "#161616",
          cardHover: "#1E1E1E",
          border: "#2A2A2A",
          text: "#F5F5F5",
          muted: "#A3A3A3",
        },
        light: {
          bg: "#FFFFFF",
          surface: "#F8F9FA",
          card: "#FFFFFF",
          cardHover: "#F3F4F6",
          border: "#E5E7EB",
          text: "#111111",
          muted: "#6B7280",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SFMono-Regular"',
          "Consolas",
          '"Liberation Mono"',
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        "orange-glow": "0 0 20px -3px rgba(255, 107, 0, 0.35)",
        "card-dark": "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
