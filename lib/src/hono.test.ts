import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"

import { Hono } from "hono"

import * as server from "./server.ts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const procedure = mock.fn<(...args: Array<any>) => Promise<any>>()

const _createRpc = mock.fn<typeof server.createRpc>(async () =>
	Promise.resolve(async (_procedureId, args) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return procedure(...args)
	}),
)

beforeEach(() => {
	procedure.mock.resetCalls()
	_createRpc.mock.resetCalls()
})

mock.module("./server.ts", {
	namedExports: {
		...server,
		createRpc: _createRpc,
	},
})

const { createRpc } = await import("./hono.ts")

async function getApp() {
	const rpc = await createRpc()

	return new Hono().post("/rpc/:id{.+}", async (ctx) => {
		return rpc(ctx, ctx.req.param("id"))
	})
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
			body: "invalid json",
		})

		assert.strictEqual(response.status, 400)

		assert.strictEqual(await response.json(), "Invalid request body")
	})

	it("returns 400 if the request body is not an array", async () => {
		const app = await getApp()

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
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
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(response.status, 204)

		assert.strictEqual(response.body, null)
	})
})
