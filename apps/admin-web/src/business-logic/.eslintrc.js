module.exports = {
  extends: ["@vecinosimple/eslint-config/base"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["dist/", "node_modules/"],
};
