import { describe, it } from "node:test"

import { z, zv } from "./zod.ts"

describe("zv", () => {
	it("should throw if the value is invalid", (t) => {
		t.assert.throws(() => {
			zv(123, z.string())
		})
	})

	it("should not throw if the value is valid", () => {
		zv("hello", z.string())
	})
})
