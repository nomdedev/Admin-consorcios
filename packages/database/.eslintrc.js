module.exports = {
  extends: ["@vecinosimple/eslint-config/base"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["node_modules/", "*.d.ts"],
  rules: {
    // Permitir any en generated types de Prisma
    "@typescript-eslint/no-explicit-any": "off",
  },
};
