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

export class ValidationError extends RpcError {
	public error

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

export class ProcedureNotFoundError extends RpcError {
	constructor() {
		super("Procedure not found")
	}
}
