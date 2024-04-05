import type { Context } from "hono"
import { streamSSE } from "hono/streaming"
import type { MiddlewareHandler } from "hono/types"

import {
	createRpc as _createRpc,
	defineState,
	ForbiddenError,
	type Options as RpcOptions,
	UnauthorizedError,
	ValidationError,
} from "./server.js"

export type MaybePromise<T> = T | Promise<T>

export type Options = RpcOptions & {
	onRequest?: (ctx: Context) => MaybePromise<void>
	onError?: (ctx: Context, error: unknown) => MaybePromise<Response>
}

const { createState: createContext, useStateOrThrow: useContext } =
	defineState<Context>()

export { useContext }

export async function createRpc({
	onRequest,
	onError,
	...options
}: Options = {}): Promise<MiddlewareHandler> {
	const rpc = await _createRpc(options)

	return async (ctx) => {
		// this forces a new async context to be created before
		// we call `createContext` to avoid context collisions
		await Promise.resolve()

		createContext(ctx)

		if (onRequest != null) {
			await onRequest(ctx)
		}

		const body: unknown = await ctx.req.json()

		try {
			const result = await rpc(body)

			if (result instanceof ReadableStream) {
				return streamSSE(ctx, async (stream) => {
					stream.onAbort(() => result.cancel())

					await stream.writeSSE({
						event: "open",
						data: "",
					})

					const reader = (result as ReadableStream<unknown>).getReader()

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

			return ctx.json(result)
		} catch (error) {
			if (onError != null) {
				return await onError(ctx, error)
			}

			if (error instanceof ValidationError) {
				// cast to unknown to avoid TS error "Type instantiation is excessively deep and possibly infinite."
				return ctx.json(error as unknown, 400)
			}

			if (error instanceof UnauthorizedError) {
				// cast to unknown to avoid TS error "Type instantiation is excessively deep and possibly infinite."
				return ctx.json(error as unknown, 401)
			}

			if (error instanceof ForbiddenError) {
				// cast to unknown to avoid TS error "Type instantiation is excessively deep and possibly infinite."
				return ctx.json(error as unknown, 403)
			}

			throw error
		}
	}
}
