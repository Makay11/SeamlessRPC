import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"

import type { ResolvedConfig, UserConfig } from "vite"
import * as vite from "vite"

import {
	DEFAULT_EXCLUDE,
	DEFAULT_INCLUDE,
	DEFAULT_ROOT_DIR,
} from "./shared/defaults.ts"

const createFilter = mock.fn(vite.createFilter)

beforeEach(() => {
	createFilter.mock.resetCalls()
})

mock.module("vite", {
	namedExports: {
		...vite,
		createFilter,
	},
})

const { rpc } = await import("./vite.ts")

describe("rpc", () => {
	it("should return a vite plugin", () => {
		const plugin = rpc()

		assert.strictEqual(plugin.name, "@makay/rpc")
	})

	it("sets config.define with default values", () => {
		const plugin = rpc()

		const config: UserConfig = {}

		plugin.config(config)

		assert.deepStrictEqual(config.define, {
			$MAKAY_RPC_URL: '"/rpc"',
			$MAKAY_RPC_CREDENTIALS: '"same-origin"',
			$MAKAY_RPC_SSE: "false",
		})
	})

	it("sets config.define with custom values", () => {
		const plugin = rpc({
			url: "/rpc/v1",
			credentials: "include",
			sse: true,
		})

		const config: UserConfig = {}

		plugin.config(config)

		assert.deepStrictEqual(config.define, {
			$MAKAY_RPC_URL: '"/rpc/v1"',
			$MAKAY_RPC_CREDENTIALS: '"include"',
			$MAKAY_RPC_SSE: "true",
		})
	})

	it("preserves existing config.define values", () => {
		const plugin = rpc({
			url: "/rpc/v1",
			credentials: "include",
			sse: true,
		})

		const config: UserConfig = {
			define: {
				foo: '"bar"',
			},
		}

		plugin.config(config)

		assert.deepStrictEqual(config.define, {
			foo: '"bar"',
			$MAKAY_RPC_URL: '"/rpc/v1"',
			$MAKAY_RPC_CREDENTIALS: '"include"',
			$MAKAY_RPC_SSE: "true",
		})
	})

	// TODO create filter with default values
	it("should create a filter with default values", () => {
		const plugin = rpc()

		assert.strictEqual(createFilter.mock.callCount(), 0)

		plugin.configResolved({
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		assert.strictEqual(createFilter.mock.callCount(), 1)

		const args = createFilter.mock.calls[0]!.arguments

		assert.deepStrictEqual(args, [
			DEFAULT_INCLUDE,
			DEFAULT_EXCLUDE,
			{
				resolve: `/root/${DEFAULT_ROOT_DIR}`,
			},
		])
	})

	// TODO create filter with custom values
	it("should create a filter with custom values", () => {
		const plugin = rpc({
			rootDir: "custom-dir",
			include: "./**/*.custom.ts",
			exclude: "./**/exclude/*.custom.ts",
		})

		assert.strictEqual(createFilter.mock.callCount(), 0)

		plugin.configResolved({
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		assert.strictEqual(createFilter.mock.callCount(), 1)

		const args = createFilter.mock.calls[0]!.arguments

		assert.deepStrictEqual(args, [
			"./**/*.custom.ts",
			"./**/exclude/*.custom.ts",
			{
				resolve: "/root/custom-dir",
			},
		])
	})

	// TODO transform file
	it("should transform a file", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved({
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `
			export async function bar() {
				return "baz"
			}

			export async function hello() {
				return "world"
			}
		`

		const transformedCode = await plugin.transform(
			code,
			"/root/src/foo.server.ts",
		)

		assert.strictEqual(
			transformedCode,
			`import { rpc } from "@makay/rpc/client"
export const bar = rpc("foo.server/bar")
export const hello = rpc("foo.server/hello")
`,
		)
	})

	// TODO respect hashPaths
	// TODO respect config.mode
	// TODO handle all export scenarios
	// TODO handle no procedures
})
