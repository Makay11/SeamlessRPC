import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"

import { Hono } from "hono"

import type { OnError, OnRequest, Options } from "./hono.ts"
import * as server from "./server.ts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const procedure = mock.fn<(...args: Array<any>) => Promise<any>>()

const _createRpc = mock.fn<typeof server.createRpc>(async () =>
	Promise.resolve(async (_procedureId, args) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return procedure(...args)
	}),
)

const getHttpStatusCode = mock.fn<typeof server.getHttpStatusCode>(
	server.getHttpStatusCode,
)

beforeEach(() => {
	procedure.mock.resetCalls()
	_createRpc.mock.resetCalls()
	getHttpStatusCode.mock.resetCalls()
})

mock.module("./server.ts", {
	namedExports: {
		...server,
		createRpc: _createRpc,
		getHttpStatusCode,
	},
})

const { createRpc, useContext } = await import("./hono.ts")

async function getApp(options?: Options) {
	const rpc = await createRpc(options)

	return new Hono().post("/rpc/:id{.+}", async (ctx) => {
		return rpc(ctx, ctx.req.param("id"))
	})
}

function noop() {
	// do nothing
}

describe("createRpc", () => {
	it("initializes", async () => {
		assert.strictEqual(_createRpc.mock.callCount(), 0)

		await createRpc()

		assert.strictEqual(_createRpc.mock.callCount(), 1)

		assert.deepStrictEqual(_createRpc.mock.calls[0]!.arguments, [undefined])
	})

	it("initializes with file options", async () => {
		assert.strictEqual(_createRpc.mock.callCount(), 0)

		await createRpc({
			files: {
				rootDir: "/path/to",
				include: ["a", "b"],
				exclude: ["c", "d"],
			},
		})

		assert.strictEqual(_createRpc.mock.callCount(), 1)

		assert.deepStrictEqual(_createRpc.mock.calls[0]!.arguments, [
			{
				rootDir: "/path/to",
				include: ["a", "b"],
				exclude: ["c", "d"],
			},
		])
	})

	it("allows calling procedures", async () => {
		procedure.mock.mockImplementationOnce(async (arg0: string, arg1: string) =>
			Promise.resolve({ arg0, arg1 }),
		)

		const app = await getApp()

		assert.strictEqual(procedure.mock.callCount(), 0)

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(procedure.mock.callCount(), 1)

		assert.strictEqual(response.status, 200)

		assert.deepStrictEqual(await response.json(), {
			arg0: "hello",
			arg1: "world",
		})
	})

	it("returns 400 if the request body is invalid JSON", async () => {
		const app = await getApp()

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "invalid json",
		})

		assert.strictEqual(response.status, 400)

		assert.strictEqual(await response.json(), "Invalid request body")
	})

	it("returns 400 if the request body is not an array", async () => {
		const app = await getApp()

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ hello: "world" }),
		})

		assert.strictEqual(response.status, 400)

		assert.strictEqual(await response.json(), "Invalid request body")
	})

	it("returns 204 if the procedure returns undefined", async () => {
		procedure.mock.mockImplementationOnce(async () =>
			Promise.resolve(undefined),
		)

		const app = await getApp()

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(response.status, 204)

		assert.strictEqual(response.body, null)
	})

	it("calls onRequest with the Hono context", async () => {
		const onRequest = mock.fn<OnRequest>()

		const app = await getApp({ onRequest })

		assert.strictEqual(onRequest.mock.callCount(), 0)

		await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(onRequest.mock.callCount(), 1)

		const ctx = onRequest.mock.calls[0]!.arguments[0]

		assert.strictEqual(ctx.req.method, "POST")
		assert.strictEqual(ctx.req.path, "/rpc/path/to/file/someMethod")
	})

	it("calls onError with the Hono context and the error", async (t) => {
		procedure.mock.mockImplementationOnce(async () =>
			Promise.reject(new Error("fake_error")),
		)

		const onError = mock.fn<OnError>(async () =>
			Promise.reject(new Error("different_error")),
		)

		const consoleError = t.mock.method(console, "error", noop)

		const app = await getApp({ onError })

		assert.strictEqual(onError.mock.callCount(), 0)

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(response.status, 500)

		assert.strictEqual(onError.mock.callCount(), 1)

		const [ctx, error] = onError.mock.calls[0]!.arguments

		assert.strictEqual(ctx.req.method, "POST")
		assert.strictEqual(ctx.req.path, "/rpc/path/to/file/someMethod")

		assert.deepEqual(error, new Error("fake_error"))

		assert.strictEqual(consoleError.mock.callCount(), 1)

		assert.deepStrictEqual(
			consoleError.mock.calls[0]!.arguments[0],
			new Error("different_error"),
		)
	})

	it("returns the status code of the RpcError when the procedure throws an RpcError", async () => {
		procedure.mock.mockImplementationOnce(async () =>
			Promise.reject(new server.RpcError("fake_rpc_error")),
		)

		const app = await getApp()

		assert.strictEqual(getHttpStatusCode.mock.callCount(), 0)

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(response.status, 500)

		assert.strictEqual(getHttpStatusCode.mock.callCount(), 1)

		const rpcError = getHttpStatusCode.mock.calls[0]!.arguments[0]

		assert(rpcError instanceof server.RpcError)
	})

	it("returns the original error when the procedure throws an Error", async (t) => {
		procedure.mock.mockImplementationOnce(async () =>
			Promise.reject(new Error("fake_error")),
		)

		const consoleError = t.mock.method(console, "error", noop)

		const app = await getApp()

		assert.strictEqual(getHttpStatusCode.mock.callCount(), 0)

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(response.status, 500)

		assert.strictEqual(getHttpStatusCode.mock.callCount(), 0)

		assert.strictEqual(consoleError.mock.callCount(), 1)

		assert.deepStrictEqual(consoleError.mock.calls[0]!.arguments, [
			new Error("fake_error"),
		])
	})

	it("allows accessing the context with useContext in a procedure", async () => {
		assert.throws(() => {
			useContext()
		}, new Error("Store has not been created."))

		procedure.mock.mockImplementationOnce(async () => {
			const ctx = useContext()

			return Promise.resolve(ctx.req.path)
		})

		const app = await getApp()

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(response.status, 200)

		assert.strictEqual(await response.json(), "/rpc/path/to/file/someMethod")
	})
})
