/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./base.js"],
  rules: {
    // NestJS permite clases vacías para decoradores
    "@typescript-eslint/no-extraneous-class": "off",

    // Permitir any en decoradores de NestJS
    "@typescript-eslint/no-explicit-any": "warn",

    // Interfaces para DTOs
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
