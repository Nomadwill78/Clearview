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
    // The Navigator is a separate, self-contained app (own package.json,
    // tsconfig.json, next.config.ts) that lives in this repo but isn't part
    // of the flipos app. tsconfig.json already excludes it from type-check;
    // exclude it here too so its own lint rules/config apply instead.
    "navigator/**",
  ]),
]);

export default eslintConfig;
