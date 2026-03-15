import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    // Global ignores — generated/compiled files
    {
        ignores: [
            'node_modules/**',
            'public/**',
            'vendor/**',
            'resources/js/ziggy.js',
            '*.config.js',
            '*.config.ts',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2022,
                route: 'readonly', // Ziggy global helper
            },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11y,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
        settings: { react: { version: 'detect' } },
    },
);
