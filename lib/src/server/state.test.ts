import assert from "node:assert"
import { describe, it } from "node:test"

import { defineState, runWithStore } from "./state.ts"

describe("runWithStore", () => {
	it("runs the given function and returns its result", () => {
		assert.deepStrictEqual(
			runWithStore(() => "result"),
			"result",
		)
	})

	it("throws if there is a nested call", () => {
		assert.throws(() => {
			runWithStore(() => {
				runWithStore(() => {
					// do nothing
				})
			})
		}, new Error("Store has already been created."))
	})
})

describe("defineState", () => {
	describe("createState", () => {
		it("creates a state", () => {
			const { createState } = defineState<string>()

			const state = runWithStore(() => createState("hello"))

			assert.strictEqual(state, "hello")
		})

		it("throws if the state has already been created", () => {
			const { createState } = defineState<string>()

			assert.throws(() => {
				runWithStore(() => {
					createState("hello")
					createState("world")
				})
			}, new Error("State has already been created."))
		})
	})
})
