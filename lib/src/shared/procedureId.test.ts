import assert from "node:assert"
import { describe, it } from "node:test"

import { getHashedProcedureId, getProcedureId } from "./procedureId.ts"

describe("getProcedureId", () => {
	it("should return the procedure id regardless of the file extension", () => {
		assert.strictEqual(getProcedureId("foo/bar.js", "baz"), "foo/bar/baz")
		assert.strictEqual(getProcedureId("foo/bar.ts", "baz"), "foo/bar/baz")
	})
})

describe("getHashedProcedureId", () => {
	it("should return the hashed procedure id regardless of the file extension", () => {
		assert.strictEqual(
			getHashedProcedureId("foo/bar.js", "baz"),
			"zF1GvbSZHG6uPrc5/baz",
		)
		assert.strictEqual(
			getHashedProcedureId("foo/bar.ts", "baz"),
			"zF1GvbSZHG6uPrc5/baz",
		)
	})
})
