import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "prisma/dev.db"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { rules: { "react/no-unescaped-entities": "off" } },
];

export default config;
