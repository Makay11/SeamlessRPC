import assert from "node:assert"
import { describe, it } from "node:test"

import {
	DEFAULT_EXCLUDE,
	DEFAULT_INCLUDE,
	DEFAULT_ROOT_DIR,
} from "./defaults.ts"

describe("DEFAULT_ROOT_DIR", () => {
	it("has the expected value", () => {
		assert.strictEqual(DEFAULT_ROOT_DIR, "src")
	})
})

describe("DEFAULT_INCLUDE", () => {
	it("has the expected value", () => {
		assert.strictEqual(DEFAULT_INCLUDE, "./**/*.server.{js,ts}")
	})
})

describe("DEFAULT_EXCLUDE", () => {
	it("has the expected value", () => {
		assert.deepStrictEqual(DEFAULT_EXCLUDE, [])
	})
})
