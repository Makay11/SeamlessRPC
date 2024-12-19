import js from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import * as tsResolver from "eslint-import-resolver-typescript"
import * as depend from "eslint-plugin-depend"
import importX from "eslint-plugin-import-x"
import packageJson from "eslint-plugin-package-json/configs/recommended"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import ts from "typescript-eslint"

export default ts.config(
	{
		ignores: ["dist"],
	},

	{
		...packageJson,
		rules: {
			...packageJson.rules,
			"package-json/sort-collections": [
				"error",
				[
					"config",
					"dependencies",
					"devDependencies",
					"exports",
					"peerDependencies",
				],
			],
		},
	},

	depend.configs["flat/recommended"],

	{
		files: ["**/*.{js,ts}"],

		extends: [
			js.configs.recommended,

			ts.configs.strictTypeChecked,
			ts.configs.stylisticTypeChecked,

			importX.flatConfigs.recommended,
			importX.flatConfigs.typescript,
		],

		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},

		settings: {
			"import-x/resolver": {
				name: "typescript",
				resolver: tsResolver,
			},
		},

		plugins: {
			// @ts-expect-error type mismatch
			"@stylistic": stylistic,
			"simple-import-sort": simpleImportSort,
		},

		rules: {
			"no-console": ["warn", { allow: ["error"] }],
			"no-useless-concat": "warn",
			"prefer-template": "warn",

			"@stylistic/spaced-comment":
				// @ts-expect-error rules are always defined
				stylistic.configs["recommended-flat"].rules[
					"@stylistic/spaced-comment"
				],

			"@typescript-eslint/array-type": ["warn", { default: "generic" }],
			"@typescript-eslint/consistent-type-definitions": ["warn", "type"],
			"@typescript-eslint/method-signature-style": ["warn", "property"],
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/prefer-destructuring": [
				"warn",
				{ array: false, object: true },
			],
			"@typescript-eslint/promise-function-async": "error",
			"@typescript-eslint/return-await": ["warn", "in-try-catch"],
			"@typescript-eslint/strict-boolean-expressions": [
				"error",
				{
					allowAny: false,
					allowNullableBoolean: false,
					allowNullableEnum: false,
					allowNullableNumber: false,
					allowNullableObject: false,
					allowNullableString: false,
					allowNumber: false,
					allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
					allowString: false,
				},
			],
			"@typescript-eslint/switch-exhaustiveness-check": "error",

			"import-x/first": "warn",
			"import-x/newline-after-import": "warn",
			"import-x/no-empty-named-blocks": "warn",
			"import-x/no-named-as-default-member": "off",
			"import-x/no-self-import": "error",

			"simple-import-sort/exports": "warn",
			"simple-import-sort/imports": "warn",
		},
	},
)
