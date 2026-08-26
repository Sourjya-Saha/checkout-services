import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        epic: ["GCEpicPro", "system-ui", "-apple-system", "sans-serif"],
        anton: ["Anton", "Impact", "sans-serif"],
        editorial: ["'Waldenburg'", "'EB Garamond'", "'Times New Roman'", "serif"],
        inter: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        canvas: {
          DEFAULT: "#f5f5f5",
          soft: "#fafafa",
          deep: "#0c0a09",
        },
        ink: {
          DEFAULT: "#0c0a09",
          primary: "#292524",
          "primary-active": "#0c0a09",
          body: "#4e4e4e",
          "body-strong": "#292524",
          muted: "#777169",
          "muted-soft": "#a8a29e",
        },
        hairline: {
          DEFAULT: "#e7e5e4",
          soft: "#f0efed",
          strong: "#d6d3d1",
        },
        surface: {
          card: "#ffffff",
          strong: "#f0efed",
          dark: "#0c0a09",
          "dark-elevated": "#1c1917",
        },
        brand: {
          mint: "#a7e5d3",
          peach: "#f4c5a8",
          lavender: "#c8b8e0",
          sky: "#a8c8e8",
          rose: "#e8b8c4",
        },
        semantic: {
          success: "#16a34a",
          error: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};
export default config;
