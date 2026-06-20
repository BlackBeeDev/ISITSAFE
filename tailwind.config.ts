import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        primary: "hsl(var(--primary))",
        brand: {
          50: "#EEF4FA",
          100: "#D6E6F2",
          200: "#AECBE3",
          500: "#4B89BC",
          600: "#397CB0",
          700: "#2F6B9A",
          800: "#24557C",
          900: "#1B3F5E"
        },
        safe: {
          50: "#F1F8E9",
          100: "#DDEFC4",
          200: "#C3E29A",
          500: "#8FCB5B",
          600: "#7FBF4A",
          700: "#5E9A30",
          800: "#46741F"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
