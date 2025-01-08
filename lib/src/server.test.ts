import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"

import type { glob as _glob } from "tinyglobby"

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

const { createRpc } = await import("./server.ts")

describe("createRpc", () => {
	it("calls glob", async () => {
		assert.strictEqual(glob.mock.callCount(), 0)

		await createRpc({
			rootDir: "/path/to",
			include: ["a", "b"],
			exclude: ["c", "d"],
		})

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

		await createRpc()

		assert.strictEqual(glob.mock.callCount(), 1)

		assert.deepStrictEqual(glob.mock.calls[0]!.arguments, [
			{
				cwd: DEFAULT_ROOT_DIR,
				patterns: DEFAULT_INCLUDE,
				ignore: DEFAULT_EXCLUDE,
			},
		])
	})

	void it.skip("imports matching files and allows calling procedures by id", async (t) => {
		glob.mock.mockImplementationOnce(async () =>
			Promise.resolve(["path/to/file.js"]),
		)

		// TODO this fails with ERR_MODULE_NOT_FOUND
		t.mock.module("/fake/path/to/file.js", {
			namedExports: {
				async someMethod(arg0: string, arg1: string) {
					return Promise.resolve({ arg0, arg1 })
				},
			},
		})

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
	})

	void it.todo(
		"imports matching files and allows calling procedures by hashed id",
	)
})
