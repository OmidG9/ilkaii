import type { Config } from "tailwindcss";

/** Colors read RGB channels from CSS variables so `/opacity` modifiers work. */
const token = (name: string) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: token("primary"),
        hover: token("hover"),
        secondary: token("secondary"),
        canvas: token("background"),
        ink: token("text"),
        line: token("border"),
        surface: token("surface"),
      },
      fontFamily: {
        sans: ["Vazirmatn", "Tahoma", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      spacing: { touch: "44px" },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(43,43,43,0.35)",
      },
      borderRadius: { luxury: "28px" },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        fadeIn: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in": "fadeIn .35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
