import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#171326", sage: "#7056d8", mint: "#f0edff", cream: "#faf9ff" }, fontFamily: { sans: ["var(--font-inter)", "sans-serif"] } } },
  plugins: []
};
export default config;
