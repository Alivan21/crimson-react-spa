import { readFileSync } from "fs";
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";
import pluginQuery from "@tanstack/eslint-plugin-query";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "dev-dist", "node_modules/*", "!.prettierrc"]),
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react,
      import: importPlugin,
      query: pluginQuery,
      prettier: eslintPluginPrettier,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      eslintConfigPrettier,
    ],
    rules: {
      "react/prop-types": "off",
      "react/jsx-curly-brace-presence": "warn",
      "react/display-name": "warn",
      "react/self-closing-comp": "warn",
      "react/jsx-sort-props": "warn",
      "react-refresh/only-export-components": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "import/order": [
        "warn",
        {
          groups: [
            "builtin", // Built-in Node.js modules
            "external", // Third-party modules
            "internal", // Your aliases (@/*)
            "object", // Object imports
            "type", // Type imports
            "index", // Index imports
            "parent", // Imports from parent directories
            "sibling", // Imports from the same directory
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "prettier/prettier": "warn",
      "import/no-duplicates": "warn",
      "sort-imports": "off",
      "import/first": "off",
      "import/newline-after-import": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    // Processor to filter out react-hooks/incompatible-library errors for files with "use no memo"
    processor: {
      preprocess(text) {
        return [text];
      },
      postprocess(messages, filename) {
        try {
          const content = readFileSync(filename, "utf-8");
          const hasUseNoMemo = /use\s+no\s+memo/i.test(content);

          if (hasUseNoMemo) {
            return messages
              .flat()
              .filter(
                (message) => message && message.ruleId !== "react-hooks/incompatible-library"
              );
          }
        } catch {
          // If we can't read the file, return messages as-is
        }
        return messages.flat().filter((message) => message != null);
      },
      supportsAutofix: true,
    },
  },
]);
