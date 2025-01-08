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
})
