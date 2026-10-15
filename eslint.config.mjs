import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import jest from "eslint-plugin-jest";
import prettier from "eslint-config-prettier/flat";
import js from "@eslint/js";

export default defineConfig([
  js.configs.recommended,
  ...nextVitals,
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    ...jest.configs["flat/recommended"],
  },
  prettier,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**"]),
]);
