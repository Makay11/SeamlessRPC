import type { Context } from "hono"
import { streamSSE } from "hono/streaming"
import type { MiddlewareHandler } from "hono/types"
import { JsonValue, Promisable } from "type-fest"

import {
	createRpc as _createRpc,
	defineState,
	ForbiddenError,
	InvalidRequestBodyError,
	type Options as RpcOptions,
	UnauthorizedError,
	ValidationError,
} from "./server.js"

export type Options = {
	onRequest?: ((ctx: Context) => Promisable<void>) | undefined
	onError?: ((ctx: Context, error: unknown) => Promisable<Response>) | undefined
	files?: RpcOptions | undefined
}

const { createState: createContext, useStateOrThrow: useContext } =
	defineState<Context>()

export { useContext }

export async function createRpc({
	onRequest,
	onError,
	files,
}: Options = {}): Promise<MiddlewareHandler> {
	const rpc = await _createRpc(files)

	return async (ctx) => {
		// this forces a new async context to be created before
		// we call `createContext` to avoid context collisions
		await Promise.resolve()

		createContext(ctx)

		if (onRequest != null) {
			await onRequest(ctx)
		}

		const procedureId = ctx.req.path // TODO figure this out
		const args = await ctx.req.json<JsonValue>()

		if (!Array.isArray(args)) {
			throw new InvalidRequestBodyError()
		}

		try {
			const result = await rpc(procedureId, args)

			if (result instanceof ReadableStream) {
				return streamSSE(ctx, async (stream) => {
					const reader = result.getReader()

					stream.onAbort(async () => reader.cancel())

					await stream.writeSSE({
						event: "open",
						data: "",
					})

					for (;;) {
						const { done, value } = await reader.read()

						if (done) {
							await stream.close()
							break
						}

						await stream.writeSSE({
							data: JSON.stringify(value),
						})
					}
				})
			}

			// @ts-expect-error Type instantiation is excessively deep and possibly infinite.
			return ctx.json(result)
		} catch (error) {
			if (onError != null) {
				return onError(ctx, error)
			}

			if (error instanceof ValidationError) {
				return ctx.json(error, 400)
			}

			if (error instanceof UnauthorizedError) {
				return ctx.json(error, 401)
			}

			if (error instanceof ForbiddenError) {
				return ctx.json(error, 403)
			}

			throw error
		}
	}
}
