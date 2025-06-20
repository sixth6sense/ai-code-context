module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
  ],
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "no-console": "off",
    "prefer-const": "error",
    "no-var": "error",
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "coverage/",
    "*.js",
    "!eslint.config.js",
  ],
};
