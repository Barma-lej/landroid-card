import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import imp from 'eslint-plugin-import';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      imp,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
];
