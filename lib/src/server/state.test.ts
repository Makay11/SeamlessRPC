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
				runWithStore(
					/* node:coverage ignore next 3 */
					() => {
						// do nothing
					},
				)
			})
		}, new Error("Store has already been created."))
	})
})

describe("defineState", () => {
	describe("createState", () => {
		it("throws if called outside of a runWithStore call", () => {
			const { createState } = defineState<string>()

			assert.throws(() => {
				createState("hello")
			}, new Error("Store has not been created."))
		})

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

	describe("replaceState", () => {
		it("throws if called outside of a runWithStore call", () => {
			const { replaceState } = defineState<string>()

			assert.throws(() => {
				replaceState("hello")
			}, new Error("Store has not been created."))
		})

		it("replaces the state", () => {
			const { createState, replaceState } = defineState<string>()

			const state = runWithStore(() => {
				createState("hello")
				return replaceState("world")
			})

			assert.strictEqual(state, "world")
		})
	})

	describe("clearState", () => {
		it("throws if called outside of a runWithStore call", () => {
			const { clearState } = defineState<string>()

			assert.throws(() => {
				clearState()
			}, new Error("Store has not been created."))
		})

		it("clears the state", () => {
			const { createState, clearState } = defineState<string>()

			const state = runWithStore(() => {
				createState("hello")
				clearState()
				return createState("world")
			})

			assert.strictEqual(state, "world")
		})
	})

	describe("useState", () => {
		it("throws if called outside of a runWithStore call", () => {
			const { useState } = defineState<string>()

			assert.throws(() => {
				useState()
			}, new Error("Store has not been created."))
		})

		it("returns the state", () => {
			const { createState, useState } = defineState<string>()

			const state = runWithStore(() => {
				createState("hello")
				return useState()
			})

			assert.strictEqual(state, "hello")
		})

		it("returns undefined if the state has not been created", () => {
			const { useState } = defineState<string>()

			const state = runWithStore(() => useState())

			assert.strictEqual(state, undefined)
		})
	})

	describe("useStateOrThrow", () => {
		it("throws if called outside of a runWithStore call", () => {
			const { useStateOrThrow } = defineState<string>()

			assert.throws(() => {
				useStateOrThrow()
			}, new Error("Store has not been created."))
		})

		it("returns the state", () => {
			const { createState, useStateOrThrow } = defineState<string>()

			const state = runWithStore(() => {
				createState("hello")
				return useStateOrThrow()
			})

			assert.strictEqual(state, "hello")
		})

		it("throws if the state has not been created", () => {
			const { useStateOrThrow } = defineState<string>()

			assert.throws(() => {
				runWithStore(() => useStateOrThrow())
			}, new Error("State has not been created."))
		})
	})
})
