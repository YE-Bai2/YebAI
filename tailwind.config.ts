import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20212A",
        muted: "#777987",
        line: "#ECECF1",
        canvas: "#F7F7FA",
        brand: { DEFAULT: "#6C5CE7", soft: "#F0EDFF", dark: "#5141C8" }
      },
      boxShadow: { soft: "0 8px 30px rgba(30, 27, 75, 0.05)" }
    }
  },
  plugins: []
};
export default config;
