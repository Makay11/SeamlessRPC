import assert from "node:assert"
import { describe, it } from "node:test"

import { stripFileExtension } from "./stripFileExtension.ts"

describe("stripFileExtension", () => {
	it("returns the file name without the file extension", () => {
		assert.strictEqual(stripFileExtension("foo.js"), "foo")
		assert.strictEqual(stripFileExtension("foo.ts"), "foo")
	})
})
