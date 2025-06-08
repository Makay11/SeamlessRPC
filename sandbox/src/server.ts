import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { createRpc } from "seamlessrpc/hono"

const app = new Hono()

app.use(
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
		console.log(`rpc server is running on http://localhost:${info.port}`)
	}
)
