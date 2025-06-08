import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"

import type { glob as _glob } from "tinyglobby"

import type { importModule as _importModule } from "./server/importModule.ts"
import {
	DEFAULT_EXCLUDE,
	DEFAULT_INCLUDE,
	DEFAULT_ROOT_DIR,
} from "./shared/defaults.ts"

const glob = mock.fn<typeof _glob>(async () => Promise.resolve([]))

beforeEach(() => {
	glob.mock.resetCalls()
})

mock.module("tinyglobby", {
	namedExports: {
		glob,
	},
})

const importModule = mock.fn<typeof _importModule>(
	/* node:coverage ignore next 3 */
	() => {
		throw new Error("Missing mock implementation.")
	},
)

beforeEach(() => {
	importModule.mock.resetCalls()
})

mock.module("./server/importModule.ts", {
	namedExports: {
		importModule,
	},
})

const { createRpc } = await import("./server.ts")

describe("createRpc", () => {
	it("calls glob", async () => {
		assert.strictEqual(glob.mock.callCount(), 0)

		await assert.rejects(
			createRpc({
				rootDir: "/path/to",
				include: ["a", "b"],
				exclude: ["c", "d"],
			}),
			(error: Error) => {
				return error.message.includes("check createRpc() configuration too")
			},
		)

		assert.strictEqual(glob.mock.callCount(), 1)

		assert.deepStrictEqual(glob.mock.calls[0]!.arguments, [
			{
				cwd: "/path/to",
				patterns: ["a", "b"],
				ignore: ["c", "d"],
			},
		])
	})

	it("calls glob with default options", async () => {
		assert.strictEqual(glob.mock.callCount(), 0)

		await assert.rejects(createRpc(), (error: Error) => {
			return error.message.includes("check createRpc() configuration too")
		})

		assert.strictEqual(glob.mock.callCount(), 1)

		assert.deepStrictEqual(glob.mock.calls[0]!.arguments, [
			{
				cwd: DEFAULT_ROOT_DIR,
				patterns: DEFAULT_INCLUDE,
				ignore: DEFAULT_EXCLUDE,
			},
		])
	})

	it("imports matching files and allows calling procedures by id or hashed id", async () => {
		glob.mock.mockImplementationOnce(async () =>
			Promise.resolve(["path/to/file.js"]),
		)

		importModule.mock.mockImplementationOnce(
			async () =>
				Promise.resolve({
					async someMethod(arg0: string, arg1: string) {
						return Promise.resolve({ arg0, arg1 })
					},
				}) as ReturnType<typeof importModule>,
		)

		const rpc = await createRpc({
			rootDir: "/fake",
		})

		assert.deepStrictEqual(
			await rpc("path/to/file/someMethod", ["hello", "world"]),
			{
				arg0: "hello",
				arg1: "world",
			},
		)

		assert.deepStrictEqual(
			await rpc("wQ4kqGqVjBdtgwua/someMethod", ["hello", "world"]),
			{
				arg0: "hello",
				arg1: "world",
			},
		)
	})
})
