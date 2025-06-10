import js from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import * as tsResolver from "eslint-import-resolver-typescript"
import command from "eslint-plugin-command/config"
import * as depend from "eslint-plugin-depend"
import { importX } from "eslint-plugin-import-x"
import eslintPluginJsonc from "eslint-plugin-jsonc"
import node from "eslint-plugin-n"
import packageJson from "eslint-plugin-package-json/configs/recommended"
import * as regexp from "eslint-plugin-regexp"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import ts from "typescript-eslint"

export default ts.config(
	{
		ignores: ["dist"],
	},

	depend.configs["flat/recommended"],

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

	// @ts-expect-error type mismatch
	eslintPluginJsonc.configs["flat/recommended-with-json"],
	eslintPluginJsonc.configs["flat/prettier"],

	{
		files: ["**/package.json"],

		rules: {
			"jsonc/sort-array-values": [
				"warn",
				{
					pathPattern: "^files$",
					order: {
						type: "asc",
					},
				},
			],
			"jsonc/sort-keys": [
				"warn",
				{
					pathPattern: "^(?:resolutions|overrides|pnpm.overrides)$",
					order: {
						type: "asc",
					},
				},
				{
					pathPattern: "^exports.*$",
					order: ["types", "import", "require", "default"],
				},
			],
		},
	},

	{
		files: ["**/tsconfig.json", "**/tsconfig.*.json"],

		rules: {
			"jsonc/sort-keys": [
				"warn",
				{
					pathPattern: "^$",
					order: [
						"extends",
						"compilerOptions",
						"references",
						"files",
						"include",
						"exclude",
					],
				},
				{
					pathPattern: "^compilerOptions$",
					order: [
						"incremental",
						"composite",
						"tsBuildInfoFile",
						"disableSourceOfProjectReferenceRedirect",
						"disableSolutionSearching",
						"disableReferencedProjectLoad",
						"target",
						"jsx",
						"jsxFactory",
						"jsxFragmentFactory",
						"jsxImportSource",
						"lib",
						"moduleDetection",
						"noLib",
						"reactNamespace",
						"useDefineForClassFields",
						"emitDecoratorMetadata",
						"experimentalDecorators",
						"baseUrl",
						"rootDir",
						"rootDirs",
						"customConditions",
						"module",
						"moduleResolution",
						"moduleSuffixes",
						"noResolve",
						"paths",
						"resolveJsonModule",
						"resolvePackageJsonExports",
						"resolvePackageJsonImports",
						"typeRoots",
						"types",
						"allowArbitraryExtensions",
						"allowImportingTsExtensions",
						"allowUmdGlobalAccess",
						"allowJs",
						"checkJs",
						"maxNodeModuleJsDepth",
						"strict",
						"strictBindCallApply",
						"strictFunctionTypes",
						"strictNullChecks",
						"strictPropertyInitialization",
						"allowUnreachableCode",
						"allowUnusedLabels",
						"alwaysStrict",
						"exactOptionalPropertyTypes",
						"noFallthroughCasesInSwitch",
						"noImplicitAny",
						"noImplicitOverride",
						"noImplicitReturns",
						"noImplicitThis",
						"noPropertyAccessFromIndexSignature",
						"noUncheckedIndexedAccess",
						"noUnusedLocals",
						"noUnusedParameters",
						"useUnknownInCatchVariables",
						"declaration",
						"declarationDir",
						"declarationMap",
						"downlevelIteration",
						"emitBOM",
						"emitDeclarationOnly",
						"importHelpers",
						"importsNotUsedAsValues",
						"inlineSourceMap",
						"inlineSources",
						"mapRoot",
						"newLine",
						"noEmit",
						"noEmitHelpers",
						"noEmitOnError",
						"outDir",
						"outFile",
						"preserveConstEnums",
						"preserveValueImports",
						"removeComments",
						"sourceMap",
						"sourceRoot",
						"stripInternal",
						"allowSyntheticDefaultImports",
						"esModuleInterop",
						"forceConsistentCasingInFileNames",
						"isolatedDeclarations",
						"isolatedModules",
						"preserveSymlinks",
						"verbatimModuleSyntax",
						"skipDefaultLibCheck",
						"skipLibCheck",
					],
				},
			],
		},
	},

	command(),

	{
		files: ["**/*.{js,ts}"],

		extends: [
			js.configs.recommended,

			ts.configs.strictTypeChecked,
			ts.configs.stylisticTypeChecked,

			importX.flatConfigs.recommended,
			importX.flatConfigs.typescript,

			regexp.configs["flat/recommended"],
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
			"@stylistic": stylistic,
			node,
			"simple-import-sort": simpleImportSort,
		},

		rules: {
			eqeqeq: ["error", "smart"],
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
			"@typescript-eslint/consistent-type-imports": "warn",
			"@typescript-eslint/method-signature-style": ["warn", "property"],
			"@typescript-eslint/no-import-type-side-effects": "warn",
			"@typescript-eslint/no-floating-promises": [
				"error",
				{
					allowForKnownSafeCalls: [
						{ from: "package", package: "node:test", name: ["describe", "it"] },
					],
				},
			],
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

			"node/no-deprecated-api": "error",
			"node/prefer-node-protocol": "warn",

			"simple-import-sort/exports": "warn",
			"simple-import-sort/imports": "warn",
		},
	},
)
