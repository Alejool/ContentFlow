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
    // ── Architecture enforcement ──────────────────────────────────────────
    // HTTP only in Services/: components, pages, hooks and stores must go
    // through a service function (wrapped in a TanStack Query hook).
    {
        files: [
            'resources/js/Components/**',
            'resources/js/Pages/**',
            'resources/js/Hooks/**',
            'resources/js/stores/**',
        ],
        rules: {
            'no-restricted-imports': [
                'warn',
                {
                    paths: [
                        {
                            name: 'axios',
                            message:
                                'HTTP solo en Services/. Crea una función en Services/{Domain} y consúmela desde un hook con TanStack Query.',
                        },
                    ],
                },
            ],
        },
    },
    // Zod schemas only in schemas/: components and pages import the inferred
    // types, never define schemas inline.
    {
        files: ['resources/js/Components/**', 'resources/js/Pages/**'],
        rules: {
            'no-restricted-imports': [
                'warn',
                {
                    paths: [
                        {
                            name: 'axios',
                            message:
                                'HTTP solo en Services/. Crea una función en Services/{Domain} y consúmela desde un hook con TanStack Query.',
                        },
                        {
                            name: 'zod',
                            message:
                                'Schemas solo en schemas/{domain}.schema.ts. Importa el schema y su tipo inferido desde ahí.',
                        },
                    ],
                },
            ],
        },
    },
    // Hard size ceiling — any file over 400 lines needs splitting.
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        rules: {
            'max-lines': [
                'warn',
                { max: 400, skipBlankLines: true, skipComments: true },
            ],
        },
    },
);
