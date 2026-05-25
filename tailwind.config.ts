import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#fbf7ef",
        porcelain: "#fffdf8",
        beige: "#e9ddce",
        taupe: "#b8aa9a",
        rose: "#c98f91",
        ink: "#201d1b"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(32, 29, 27, 0.08)"
      },
      fontFamily: {
        sans: ["Inter", "Aptos", "Segoe UI", "ui-sans-serif", "system-ui"],
        serif: ["Cormorant Garamond", "Georgia", "Cambria", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
