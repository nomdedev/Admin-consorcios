module.exports = {
  extends: ["@vecinosimple/eslint-config/nestjs"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["dist/", "node_modules/"],
};
