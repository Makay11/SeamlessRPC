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

	it("should create a filter with default values", () => {
		const plugin = rpc()

		const config: Partial<ResolvedConfig> = {
			root: "/root",
			mode: "development",
		}

		assert.strictEqual(createFilter.mock.callCount(), 0)

		plugin.configResolved(config as ResolvedConfig)

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

	it("should create a filter with custom values", () => {
		const plugin = rpc({
			rootDir: "custom-dir",
			include: "**/*.custom.ts",
			exclude: "**/exclude/*.custom.ts",
		})

		const config: Partial<ResolvedConfig> = {
			root: "/root",
			mode: "development",
		}

		assert.strictEqual(createFilter.mock.callCount(), 0)

		plugin.configResolved(config as ResolvedConfig)

		assert.strictEqual(createFilter.mock.callCount(), 1)

		const args = createFilter.mock.calls[0]!.arguments

		assert.deepStrictEqual(args, [
			"**/*.custom.ts",
			"**/exclude/*.custom.ts",
			{
				resolve: "/root/custom-dir",
			},
		])
	})

	// TODO transform file
	// TODO respect rootDir
	// TODO respect include
	// TODO respect exclude
	// TODO respect hashPaths
	// TODO respect config.mode
	// TODO handle all export scenarios
	// TODO handle no procedures
})
