import assert from "node:assert"
import { beforeEach, describe, it, mock } from "node:test"

import { fromPartial } from "@total-typescript/shoehorn"
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

const configCtx = fromPartial<vite.ConfigPluginContext>({})
const configResolvedCtx =
	fromPartial<vite.MinimalPluginContextWithoutEnvironment>({})

describe("rpc", () => {
	it("returns a vite plugin", () => {
		const plugin = rpc()

		assert.strictEqual(plugin.name, "seamlessrpc")
	})

	it("sets config.define with default values", () => {
		const plugin = rpc()

		const config: UserConfig = {}

		plugin.config.call(configCtx, config)

		assert.deepStrictEqual(config.define, {
			__SEAMLESSRPC_URL: '"/rpc"',
			__SEAMLESSRPC_CREDENTIALS: '"same-origin"',
			__SEAMLESSRPC_SSE: "false",
		})
	})

	it("sets config.define with custom values", () => {
		const plugin = rpc({
			url: "/rpc/v1",
			credentials: "include",
			sse: true,
		})

		const config: UserConfig = {}

		plugin.config.call(configCtx, config)

		assert.deepStrictEqual(config.define, {
			__SEAMLESSRPC_URL: '"/rpc/v1"',
			__SEAMLESSRPC_CREDENTIALS: '"include"',
			__SEAMLESSRPC_SSE: "true",
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

		plugin.config.call(configCtx, config)

		assert.deepStrictEqual(config.define, {
			foo: '"bar"',
			__SEAMLESSRPC_URL: '"/rpc/v1"',
			__SEAMLESSRPC_CREDENTIALS: '"include"',
			__SEAMLESSRPC_SSE: "true",
		})
	})

	it("creates a filter with default values", () => {
		const plugin = rpc()

		assert.strictEqual(createFilter.mock.callCount(), 0)

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		assert.strictEqual(createFilter.mock.callCount(), 1)

		const { arguments: args, result: filter } = createFilter.mock.calls[0]!

		assert.deepStrictEqual(args, [
			DEFAULT_INCLUDE,
			DEFAULT_EXCLUDE,
			{
				resolve: `/root/${DEFAULT_ROOT_DIR}`,
			},
		])

		assert(filter != null)

		assert.strictEqual(filter(`/root/${DEFAULT_ROOT_DIR}/foo.server.ts`), true)

		assert.strictEqual(filter("/root/random-dir/foo.server.ts"), false)
		assert.strictEqual(filter("/random-root/src/foo.server.ts"), false)
	})

	it("creates a filter with custom values", () => {
		const plugin = rpc({
			rootDir: "custom-dir",
			include: "./**/*.custom.ts",
			exclude: "./**/exclude/*.custom.ts",
		})

		assert.strictEqual(createFilter.mock.callCount(), 0)

		plugin.configResolved.call(configResolvedCtx, {
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

	it("transforms a file", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved.call(configResolvedCtx, {
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
			`import { rpc } from "seamlessrpc/client"
export const bar = rpc("foo.server/bar")
export const hello = rpc("foo.server/hello")
`,
		)
	})

	it("does not transform filtered out files", async () => {
		const plugin = rpc({
			rootDir: "src",
			exclude: ["**/excluded/**"],
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `
			export async function bar() {
				return "baz"
			}
		`

		const transformedCode = await plugin.transform(
			code,
			"/root/src/excluded/foo.server.ts",
		)

		assert.strictEqual(transformedCode, undefined)
	})

	it("transforms a file with hashed paths when hashPaths is true", async () => {
		const plugin = rpc({
			rootDir: "src",
			hashPaths: true,
		})

		plugin.configResolved.call(configResolvedCtx, {
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
			`import { rpc } from "seamlessrpc/client"
export const bar = rpc("-5KgEd_NKIC7DUMm/bar")
export const hello = rpc("-5KgEd_NKIC7DUMm/hello")
`,
		)
	})

	it("transforms a file with hashed paths when hashPaths is undefined and config.mode is production", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "production",
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
			`import { rpc } from "seamlessrpc/client"
export const bar = rpc("-5KgEd_NKIC7DUMm/bar")
export const hello = rpc("-5KgEd_NKIC7DUMm/hello")
`,
		)
	})

	it("transforms a file without hashed paths when hashPaths is false and config.mode is production", async () => {
		const plugin = rpc({
			rootDir: "src",
			hashPaths: false,
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "production",
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
			`import { rpc } from "seamlessrpc/client"
export const bar = rpc("foo.server/bar")
export const hello = rpc("foo.server/hello")
`,
		)
	})

	it("rejects default exports", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `
		export default async function foo() {
			return "bar"
		}
	`

		await assert.rejects(
			plugin.transform(code, "/root/src/foo.server.ts"),
			new Error("Default exports are not allowed."),
		)
	})

	it("rejects export all declarations", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `export * from "./other"`

		await assert.rejects(plugin.transform(code, "/root/src/foo.server.ts"), {
			message: "All exports must be local plain async functions.",
		})
	})

	it("rejects indirect exports", async () => {
		const plugin = rpc({ rootDir: "src" })
		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `
		async function foo() {
			return "bar"
		}
		export { foo }
	`

		await assert.rejects(plugin.transform(code, "/root/src/foo.server.ts"), {
			message: "All exports must be local plain async functions.",
		})
	})

	it("rejects non-function named exports", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `export const foo = "bar"`

		await assert.rejects(plugin.transform(code, "/root/src/foo.server.ts"), {
			message: "All exports must be local plain async functions.",
		})
	})

	it("rejects non-async function exports", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `
		export function foo() {
			return "bar"
		}
	`

		await assert.rejects(plugin.transform(code, "/root/src/foo.server.ts"), {
			message: "All exports must be local plain async functions.",
		})
	})

	it("rejects async generator function exports", async () => {
		const plugin = rpc({ rootDir: "src" })
		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = `
		export async function* foo() {
			yield "bar"
		}
	`

		await assert.rejects(plugin.transform(code, "/root/src/foo.server.ts"), {
			message: "All exports must be local plain async functions.",
		})
	})

	it("transforms a file with no procedures", async () => {
		const plugin = rpc({
			rootDir: "src",
		})

		plugin.configResolved.call(configResolvedCtx, {
			root: "/root",
			mode: "development",
		} as ResolvedConfig)

		const code = ``

		const transformedCode = await plugin.transform(
			code,
			"/root/src/foo.server.ts",
		)

		assert.strictEqual(transformedCode, `export {}`)
	})
})
