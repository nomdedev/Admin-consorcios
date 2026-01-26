module.exports = {
  extends: ["@vecinosimple/eslint-config/react-library"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["dist/", "node_modules/"],
};
