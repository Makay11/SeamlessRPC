import antfu, { stylistic } from "@antfu/eslint-config"
import * as depend from "eslint-plugin-depend"
import packageJson from "eslint-plugin-package-json/configs/recommended"

export default antfu(
	{
		stylistic: false,

		type: "lib",

		typescript: {
			tsconfigPath: "tsconfig.json",

			overridesTypeAware: {
				"ts/prefer-destructuring": ["warn", { array: false, object: true }],
				"ts/require-await": "warn",
			},
		},
	},

	stylistic().then((configs) =>
		configs.map((config) => {
			if (config.name === "antfu/stylistic/rules" && config.rules != null) {
				return {
					...config,
					rules: {
						"style/spaced-comment": config.rules["style/spaced-comment"],
					},
				}
			}
			return config
		}),
	),

	depend.configs["flat/recommended"],

	{
		files: ["**/package.json"],
		rules: {
			"jsonc/sort-keys": "off",
		},
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

	{
		files: ["**/*.md"],
		rules: {
			"no-irregular-whitespace": "off",
		},
	},

	{
		rules: {
			"no-useless-concat": "warn",

			"import/newline-after-import": "warn",

			"perfectionist/sort-imports": [
				"warn",
				{
					groups: [
						"side-effect",
						"builtin",
						"external",
						"internal",
						["parent", "sibling", "index"],
						"object",
						"unknown",
					],
					newlinesBetween: "always",
					order: "asc",
					type: "natural",
				},
			],

			"ts/consistent-type-definitions": ["warn", "type"],
			"ts/explicit-function-return-type": "off",
		},
	},
)
