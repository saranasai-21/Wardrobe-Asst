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
        obsidian: {
          DEFAULT: "#09090B",
          50: "#27272A",
          100: "#1E1E22",
          200: "#18181B",
          300: "#121215",
          400: "#0D0D10",
          500: "#09090B",
        },
        vault: {
          gold: "#F59E0B",
          amber: "#D97706",
          cyan: "#06B6D4",
          neon: "#10B981",
        },
      },
      backgroundImage: {
        "spotlight-radial": "radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.12) 0%, rgba(9, 9, 11, 0) 65%)",
        "pedestal-gradient": "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%)",
      },
    },
  },
  plugins: [],
};
export default config;
