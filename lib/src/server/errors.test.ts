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

describe("RpcError", () => {
	it("toJSON returns the error message", () => {
		assert.deepStrictEqual(
			new RpcError("error_message").toJSON(),
			"error_message",
		)
	})
})

describe("InvalidRequestBodyError", () => {
	it("extends RpcError", () => {
		assert.ok(new InvalidRequestBodyError() instanceof RpcError)
	})

	it("toJSON returns a predefined message", () => {
		assert.deepStrictEqual(
			new InvalidRequestBodyError().toJSON(),
			"Invalid request body",
		)
	})
})

void describe.only("ValidationError", () => {
	it("extends RpcError", () => {
		assert.ok(new ValidationError() instanceof RpcError)
	})

	describe("error is set", () => {
		it("toJSON returns the error", () => {
			assert.deepStrictEqual(
				new ValidationError("some_error").toJSON(),
				"some_error",
			)
		})

		it("exposes the error field", () => {
			assert.deepStrictEqual(
				new ValidationError("some_error").error,
				"some_error",
			)
		})
	})

	describe("error is not set", () => {
		it("toJSON returns a predefined message", () => {
			assert.deepStrictEqual(new ValidationError().toJSON(), "Validation error")
		})
	})
})

describe("UnauthorizedError", () => {
	it("extends RpcError", () => {
		assert.ok(new UnauthorizedError() instanceof RpcError)
	})

	it("toJSON returns a predefined message", () => {
		assert.deepStrictEqual(new UnauthorizedError().toJSON(), "Unauthorized")
	})
})

describe("ForbiddenError", () => {
	it("extends RpcError", () => {
		assert.ok(new ForbiddenError() instanceof RpcError)
	})

	it("toJSON returns a predefined message", () => {
		assert.deepStrictEqual(new ForbiddenError().toJSON(), "Forbidden")
	})
})

describe("ProcedureNotFoundError", () => {
	it("extends RpcError", () => {
		assert.ok(new ProcedureNotFoundError() instanceof RpcError)
	})

	it("toJSON returns a predefined message", () => {
		assert.deepStrictEqual(
			new ProcedureNotFoundError().toJSON(),
			"Procedure not found",
		)
	})
})

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
