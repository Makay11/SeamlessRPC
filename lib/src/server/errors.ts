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

export function getHttpStatusCode(error: RpcError) {
	if (
		error instanceof InvalidRequestBodyError ||
		error instanceof ValidationError
	) {
		return 400
	}

	if (error instanceof UnauthorizedError) {
		return 401
	}

	if (error instanceof ForbiddenError) {
		return 403
	}

	if (error instanceof ProcedureNotFoundError) {
		return 404
	}

	return 500
}
