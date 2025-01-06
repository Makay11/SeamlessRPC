import assert from "node:assert"
import { describe, it } from "node:test"

import { err, errConst, ok, okConst } from "./result.ts"

describe("ok", () => {
	it("returns a result with the given value", () => {
		assert.deepStrictEqual(ok(42), { ok: true, value: 42 })
	})
})

describe("okConst", () => {
	it("returns a result with the given value", () => {
		assert.deepStrictEqual(okConst(42), { ok: true, value: 42 })
	})
})

describe("err", () => {
	it("returns a result with the given error", () => {
		assert.deepStrictEqual(err("some_error"), {
			ok: false,
			error: "some_error",
		})
	})
})

describe("errConst", () => {
	it("returns a result with the given error", () => {
		assert.deepStrictEqual(errConst("some_error"), {
			ok: false,
			error: "some_error",
		})
	})
})
