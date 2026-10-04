import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "playwright-report", "test-results"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      eqeqeq: ["error", "always"],
      // Порядок импортов: побочные эффекты, внешние пакеты, алиас `@/`, относительные.
      // Группы перечислены явно, потому что по умолчанию плагин считает `@/...`
      // внешним пакетом и смешивает его с зависимостями.
      "simple-import-sort/imports": [
        "error",
        {
          groups: [["^\\u0000"], ["^node:", "^@?\\w"], ["^@/"], ["^\\."]],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  {
    // Модули дерева роутов экспортируют рядом с компонентами фабрики роутов и сам
    // `router` — предупреждение здесь неустранимо самим устройством файла.
    files: ["src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
