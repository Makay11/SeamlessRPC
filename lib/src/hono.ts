import type { Context } from "hono"
import { streamSSE } from "hono/streaming"
import type { JsonValue, Promisable } from "type-fest"

import {
	createRpc as _createRpc,
	defineState,
	getHttpStatusCode,
	InvalidRequestBodyError,
	type Options as RpcOptions,
	RpcError,
	runWithStore,
} from "./server.ts"

export type Options = {
	onRequest?: ((ctx: Context) => Promisable<void>) | undefined
	onError?: ((ctx: Context, error: unknown) => Promisable<Response>) | undefined
	files?: RpcOptions | undefined
}

const { createState: createContext, useStateOrThrow: useContext } =
	defineState<Context>()

export { useContext }

export async function createRpc({ onRequest, onError, files }: Options = {}) {
	const rpc = await _createRpc(files)

	return async (ctx: Context, procedureId: string) =>
		runWithStore(async () => {
			try {
				createContext(ctx)

				if (onRequest != null) {
					await onRequest(ctx)
				}

				const args = await ctx.req.json<JsonValue>()

				if (!Array.isArray(args)) {
					throw new InvalidRequestBodyError()
				}

				const result = await rpc(procedureId, args)

				if (result === undefined) {
					ctx.status(204)
					return ctx.body(null)
				}

				if (result instanceof ReadableStream) {
					return streamSSE(
						ctx,
						async (stream) => {
							const reader = result.getReader()

							stream.onAbort(async () => reader.cancel())

							await stream.writeSSE({
								event: "connected",
								data: "",
							})

							try {
								for (;;) {
									const { done, value } = await reader.read()

									if (done) break

									await stream.writeSSE({
										data: JSON.stringify(value),
									})
								}
							} finally {
								reader.releaseLock()
							}
						},
						async () => {
							// empty error handler to make Hono send the error to the client
							// also suppresses the default logging of the error
						},
					)
				}

				// @ts-expect-error Type instantiation is excessively deep and possibly infinite.
				return ctx.json(result)
			} catch (error) {
				if (onError != null) {
					return onError(ctx, error)
				}

				if (error instanceof RpcError) {
					return ctx.json(error, getHttpStatusCode(error))
				}

				throw error
			}
		})
}
