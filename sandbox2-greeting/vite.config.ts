import { rpc } from "seamlessrpc/vite"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		rpc({
			url: "http://localhost:3000/rpc",
			credentials: "include",
			include: "**/*.rpc.{js,ts}",
		}),
	],

	server: {
		port: 5173,
		strictPort: true,
	},

	preview: {
		port: 5173,
		strictPort: true,
	},
})
