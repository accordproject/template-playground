/* eslint-env node */

module.exports = {
	root: true,

	env: {
		browser: true,
		es2020: true,
		node: true,
	},

	extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],

	overrides: [
		{
			files: ['src/**/*.{ts,tsx}'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: true,
				tsconfigRootDir: __dirname,
			},
			extends: [
				'plugin:@typescript-eslint/recommended',
				'plugin:@typescript-eslint/recommended-requiring-type-checking',
			],
			plugins: ['react-refresh'],
			rules: {
				'react-refresh/only-export-components': [
					'warn',
					{allowConstantExport: true},
				],
				'@typescript-eslint/no-non-null-assertion': 'off',
			},
		},

		{
			files: ['*.config.js', '*.config.ts', '.eslintrc.cjs'],
			parserOptions: {
				project: null,
			},
			env: {
				node: true,
			},
		},
	],
};
