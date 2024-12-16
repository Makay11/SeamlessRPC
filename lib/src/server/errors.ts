import type { JsonValue } from "type-fest"

export class RpcError extends Error {
	toJSON(): JsonValue {
		return this.message
	}
}

export class InvalidRequestBodyError extends RpcError {
	constructor() {
		super("Invalid request body")
	}
}

export class UnknownProcedureError extends RpcError {
	constructor() {
		super("Unknown procedure")
	}
}

export class ValidationError extends RpcError {
	error: JsonValue | undefined

	constructor(error?: JsonValue) {
		super("Validation error")

		this.error = error
	}

	override toJSON() {
		return this.error ?? super.toJSON()
	}
}

export class UnauthorizedError extends RpcError {
	constructor() {
		super("Unauthorized")
	}
}

export class ForbiddenError extends RpcError {
	constructor() {
		super("Forbidden")
	}
}
