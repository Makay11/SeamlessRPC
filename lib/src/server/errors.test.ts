import assert from "node:assert"
import { describe, it } from "node:test"

import {
	ForbiddenError,
	getHttpStatusCode,
	InvalidRequestBodyError,
	ProcedureNotFoundError,
	RpcError,
	UnauthorizedError,
	ValidationError,
} from "./errors.ts"

describe("getHttpStatusCode", () => {
	it("returns 400 for InvalidRequestBodyError", () => {
		assert.strictEqual(getHttpStatusCode(new InvalidRequestBodyError()), 400)
	})

	it("returns 400 for ValidationError", () => {
		assert.strictEqual(getHttpStatusCode(new ValidationError()), 400)
	})

	it("returns 401 for UnauthorizedError", () => {
		assert.strictEqual(getHttpStatusCode(new UnauthorizedError()), 401)
	})

	it("returns 403 for ForbiddenError", () => {
		assert.strictEqual(getHttpStatusCode(new ForbiddenError()), 403)
	})

	it("returns 404 for ProcedureNotFoundError", () => {
		assert.strictEqual(getHttpStatusCode(new ProcedureNotFoundError()), 404)
	})

	it("returns 500 for other errors", () => {
		assert.strictEqual(getHttpStatusCode(new RpcError()), 500)
	})
})
