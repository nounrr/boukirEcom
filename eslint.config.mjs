// Next.js recommended rules (Core Web Vitals + TypeScript), the official setup for Next 16.
// Run with `npm run lint`.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "out/**", "next-env.d.ts", "scripts/**"],
  },
  {
    rules: {
      // Older code still uses `any` in many places: reported, to be typed progressively.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // React Compiler advice. The compiler is not enabled in next.config.ts, so these do not
      // break anything today: reported as warnings until it is.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
];
