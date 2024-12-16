import antfu, { stylistic } from "@antfu/eslint-config"

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

	// @ts-expect-error
	stylistic().then(([stylistic]) => ({
		...stylistic,
		rules: {
			// @ts-expect-error
			"style/spaced-comment": stylistic.rules["style/spaced-comment"],
		},
	})),

	{
		files: ["**/*.md"],
		rules: {
			"no-irregular-whitespace": "off",
		},
	},

	{
		rules: {
			"no-useless-concat": "warn",

			"perfectionist/sort-imports": [
				"warn",
				{
					groups: [
						"type",
						["parent-type", "sibling-type", "index-type", "internal-type"],
						"builtin",
						"external",
						"internal",
						["parent", "sibling", "index"],
						"side-effect",
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
