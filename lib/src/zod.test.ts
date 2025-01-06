import assert from "node:assert"
import { describe, it } from "node:test"

import { ValidationError } from "./server.ts"
import { z, zv } from "./zod.ts"

describe("zv", () => {
	it("should throw a ValidationError if the value is invalid", () => {
		assert.throws(() => {
			zv(123, z.string())
		}, ValidationError)
	})

	it("should not throw if the value is valid", () => {
		assert.doesNotThrow(() => {
			zv("hello", z.string())
		})
	})
})
