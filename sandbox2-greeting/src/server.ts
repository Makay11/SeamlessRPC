import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { createRpc } from "seamlessrpc/hono"

const app = new Hono()
const rpc = await createRpc({
	files: {
		include: "**/*.rpc.{ts,js}",
	},
})

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
)
app.post("/rpc/:id{.+}", async (ctx) => {
	const x = rpc(ctx, ctx.req.param("id"))
	return x
})

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.info(`Server is running on http://localhost:${info.port}`)
	}
)
