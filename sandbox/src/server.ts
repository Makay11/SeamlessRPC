import { serve } from "@hono/node-server"
import { createRpc } from "@makay/rpc/hono"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

const app = new Hono()

app.use(
	logger(),

	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
)

const rpc = await createRpc()

app.post("/rpc/:id{.+}", (ctx) => {
	return rpc(ctx, ctx.req.param("id"))
})

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`)
	}
)
