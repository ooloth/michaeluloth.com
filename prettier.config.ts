// See: https://prettier.io/docs/configuration

import { type Config } from "prettier";

const config: Config = {
  arrowParens: "avoid",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "lf",
  htmlWhitespaceSensitivity: "css",
  insertPragma: false,
  jsxSingleQuote: false,
  // See: https://prettier.io/docs/en/plugins.html
  plugins: ["@prettier/plugin-xml", "prettier-plugin-toml"],
  printWidth: 120,
  proseWrap: "preserve",
  quoteProps: "as-needed",
  requirePragma: false,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
};

export default config;
