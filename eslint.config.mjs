import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/data",
              message: "Import the exact @/lib/data/<feature> module.",
            },
            {
              name: "@/lib/content",
              message: "Import @/lib/site-clock or an exact data module.",
            },
            {
              name: "@/lib/data/catalog",
              message: "Import the exact @/lib/data/<feature> module.",
            },
            {
              name: "@/lib/home-model",
              message: "Import the exact @/lib/home module.",
            },
            {
              name: "@/lib/content-repository",
              message: "Import the exact @/lib/stores or @/lib/data module.",
            },
            {
              name: "@/lib/editorial-policy",
              message: "Import the exact @/lib/policy module.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}", "scripts/**/*.ts"],
    ignores: [
      "src/lib/types.ts",
      "src/lib/editorial-policy.ts",
      "src/lib/content.ts",
      "src/lib/content-repository.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/content",
              message: "Import the exact src/lib/stores or src/lib/data module.",
            },
            {
              name: "./content",
              message: "Import the exact src/lib/stores or src/lib/data module.",
            },
            {
              name: "../content",
              message: "Import the exact src/lib/stores or src/lib/data module.",
            },
            {
              name: "../../content",
              message: "Import the exact src/lib/stores or src/lib/data module.",
            },
          ],
          patterns: [
            {
              group: ["./types", "../types", "../../types", "@/lib/types"],
              message: "Import the exact src/lib/domain contract.",
            },
            {
              group: [
                "./editorial-policy",
                "../editorial-policy",
                "../../editorial-policy",
                "@/lib/editorial-policy",
              ],
              message: "Import the exact src/lib/policy module.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
