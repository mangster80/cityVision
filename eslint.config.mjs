import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: ["**/.next/**", "**/.next-dev/**", "**/node_modules/**"] },
  ...nextVitals,
  {
    rules: {
      "import/no-anonymous-default-export": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
