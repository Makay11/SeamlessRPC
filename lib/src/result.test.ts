import { describe, it } from "node:test"

import { err, errConst, ok, okConst } from "./result.ts"

describe("ok", () => {
	it("should return a result with the given value", (t) => {
		t.assert.deepEqual(ok(42), { ok: true, value: 42 })
	})
})

describe("okConst", () => {
	it("should return a result with the given value", (t) => {
		t.assert.deepEqual(okConst(42), { ok: true, value: 42 })
	})
})

describe("err", () => {
	it("should return a result with the given error", (t) => {
		t.assert.deepEqual(err("some_error"), {
			ok: false,
			error: "some_error",
		})
	})
})

describe("errConst", () => {
	it("should return a result with the given error", (t) => {
		t.assert.deepEqual(errConst("some_error"), {
			ok: false,
			error: "some_error",
		})
	})
})
