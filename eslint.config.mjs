import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  prettierConfig,

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { prettier },
    rules: {
      "prettier/prettier": ["warn", { endOfLine: "auto" }],

      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",

      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@next/next/no-img-element": "warn",
    },
  },

  {
    files: [
      "src/components/ui/input.tsx",
      "src/components/ui/textarea.tsx",
    ],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },

  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;