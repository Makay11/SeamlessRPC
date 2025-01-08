import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"

import { Hono } from "hono"
import type { JsonValue } from "type-fest"

import * as server from "./server.ts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakeMethod = mock.fn<(...args: Array<any>) => Promise<JsonValue>>()

const _createRpc = mock.fn<typeof server.createRpc>(async () =>
	Promise.resolve(async (_procedureId, args) => fakeMethod(...args)),
)

beforeEach(() => {
	fakeMethod.mock.resetCalls()
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
		fakeMethod.mock.mockImplementationOnce(async (arg0: string, arg1: string) =>
			Promise.resolve({ arg0, arg1 }),
		)

		const app = await getApp()

		assert.strictEqual(fakeMethod.mock.callCount(), 0)

		const response = await app.request("/rpc/path/to/file/someMethod", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(["hello", "world"]),
		})

		assert.strictEqual(fakeMethod.mock.callCount(), 1)

		assert.strictEqual(response.status, 200)

		assert.deepStrictEqual(await response.json(), {
			arg0: "hello",
			arg1: "world",
		})
	})
})
