import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17304f",
        muted: "#64748b",
        soft: "#f1f8ff",
        blue: "#4b9cf5"
      },
      boxShadow: {
        soft: "0 22px 70px rgba(57, 130, 220, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
