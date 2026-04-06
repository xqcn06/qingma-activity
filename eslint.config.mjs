import nextPlugin from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextPlugin.configs["core-web-vitals"],
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];
