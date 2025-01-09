import assert from "node:assert"
import { describe, it } from "node:test"

import type { UserConfig } from "vite"

import { rpc } from "./vite.ts"

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
})
