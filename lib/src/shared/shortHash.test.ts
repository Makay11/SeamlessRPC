import assert from "node:assert"
import { describe, it } from "node:test"

import { shortHash } from "./shortHash.ts"

describe("shortHash", () => {
	it("returns the first 16 characters of the SHA256 hash encoded in base64url", () => {
		assert.strictEqual(shortHash("hello"), "LPJNul-wow4m6Dsq")
	})
})
