import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "Tahoma", "Arial", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        persian: ["Vazirmatn", "IRANSansX", "Tahoma", "Arial", "sans-serif"],
      },
      colors: {
        luxury: {
          primary: "#6B5E57",
          secondary: "#A89C94",
          background: "#F5F1ED",
          text: "#2B2B2B",
          lightBg: "#FAFAF8",
          border: "#E8E3DE",
          hover: "#5A4D46",
        },
      },
      backgroundColor: {
        primary: "#6B5E57",
        secondary: "#A89C94",
        light: "#F5F1ED",
        lighter: "#FAFAF8",
      },
      textColor: {
        primary: "#6B5E57",
        secondary: "#A89C94",
        dark: "#2B2B2B",
      },
      borderColor: {
        primary: "#6B5E57",
        light: "#E8E3DE",
      },
      spacing: {
        "touch-target": "44px",
        "safe-area": "max(1rem, env(safe-area-inset-left))",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
export default config;
