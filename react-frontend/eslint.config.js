import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
// Import the Prettier recommended configuration for flat config
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"; // <--- Import this

export default tseslint.config(
  // Global ignores
  { ignores: ["dist"] },

  // Base JavaScript and TypeScript recommended rules
  // Applied to all files matching the default pattern (js, mjs, cjs, ts, mts, cts, tsx, etc.)
  // (You might want to add a 'files' key here if you didn't intend these to apply so broadly)
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Configuration specifically for TS/TSX files
  {
    files: ["**/*.{ts,tsx}"], // Target TypeScript and TSX files
    languageOptions: {
      // No need to repeat ecmaVersion, it's often inherited or inferred
      // parserOptions: { // Use parserOptions inside languageOptions for TS features
      //   project: true, // Consider enabling for type-aware linting
      //   tsconfigRootDir: import.meta.dirname, // Helps TS find your tsconfig.json
      // },
      globals: {
        ...globals.browser, // Add browser globals
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin, // Explicitly map the plugin object
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      // 'prettier' plugin is included via the recommended config below
    },
    rules: {
      // Inherit rules from plugins if needed (or configure manually)
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Add any specific TS/React rules here if needed
      // e.g., '@typescript-eslint/no-unused-vars': 'warn',

      // NOTE: No 'prettier/prettier': 'error' rule needed here,
      // it's included and configured by eslintPluginPrettierRecommended
    },
    // Optional: Add settings like React version detection if not automatically handled
    // settings: {
    //   react: {
    //     version: 'detect',
    //   },
    // },
  },

  // Add the Prettier recommended configuration LAST
  eslintPluginPrettierRecommended, // <--- Add this here
);
