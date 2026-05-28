import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // These panels use effects to reset/animate local UI state when their
      // inputs change (intent bar, typing replay, escalation countdown). That's
      // an intentional, contained pattern for this demo, not a render cascade.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
