import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "public/",
      "next-env.d.ts",
      "**/*.test.*",
      "**/*.spec.*",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Disable rules that might cause deployment issues
      "react-hooks/exhaustive-deps": "warn",
      "no-console": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
