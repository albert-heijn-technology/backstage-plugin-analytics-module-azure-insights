module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: ["plugin:storybook/recommended", "plugin:deprecation/recommended"],

  ignorePatterns: ["*.js", "*.d.ts"],

  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
};
