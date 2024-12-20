import { serve } from "@hono/node-server"
import { createRpc } from "@makay/rpc/hono"
import { Hono } from "hono"
import { cors } from "hono/cors"

const app = new Hono()

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
)

app.all("/rpc/*", await createRpc())

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`)
	}
)
