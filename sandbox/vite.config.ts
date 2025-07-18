import { fileURLToPath, URL } from "node:url"

import vue from "@vitejs/plugin-vue"
import { spawn } from "node:child_process"
import { rpc } from "seamlessrpc/vite"
import { defineConfig } from "vite"
import Inspect from "vite-plugin-inspect"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),

		rpc({
			url: "http://localhost:3000/rpc",
			credentials: "include",
			sse: true,
		}),

		{
			name: "Run rpc server",
			configureServer() {
				spawn("pnpm", ["run", "dev:server"], {
					stdio: ["ignore", "inherit", "inherit"],
				})
			},
			configurePreviewServer() {
				spawn("pnpm", ["run", "dev:server"], {
					stdio: ["ignore", "inherit", "inherit"],
				})
			},
		},

		Inspect(),
	],

	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},

	server: {
		port: 5173,
		strictPort: true,
	},

	preview: {
		port: 5173,
		strictPort: true,
	},
})
