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
    // Vendored AI-tooling skills (gitignored, symlinked into .claude/skills/) —
    // not our code; linting it buries real findings from src/.
    ".agents/**",
  ]),
  {
    // Test files mock next/image with a bare <img>; the LCP concern doesn't apply.
    files: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
