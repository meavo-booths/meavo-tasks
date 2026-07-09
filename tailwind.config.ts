import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@meavo/navigation/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#d1f4e0",
          200: "#a7ebc4",
          500: "#30A46C",
          600: "#2b9662",
          700: "#0C8F61",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 4px 6px rgba(15, 23, 42, 0.05), 0 12px 24px rgba(15, 23, 42, 0.06)",
        modal: "0 24px 48px rgba(15, 23, 42, 0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
