# 🌐 SeamlessRPC

An RPC library for quick development of seamless full-stack applications.

Powered by a [Vite](https://vitejs.dev/) plugin and inspired by [Telefunc](https://telefunc.com/), [tRPC](https://trpc.io/) and other similar libraries.

Previously known as [@makay/rpc](https://github.com/Makay11/rpc).

---

<div align="center">

[✨ Features](#-features)
[🔧 Installation and setup](#-installation-and-setup)
[🚀 Usage](#-usage)

[📝 Input validation](#-input-validation)
[🚨 Errors](#-errors)
[📦 Async server state](#-async-server-state)
[👍 Results](#-results)
[📡 Subscriptions](#-subscriptions)

[🔌 Adapters](#-adapters)
[<img src="icons/logos--hono.svg" alt="" height="14"> Hono](#-hono)
[<img src="icons/logos--vue.svg" alt="" height="14"> Vue](#-vue)
[<img src="icons/logos--zod.svg" alt="" height="14"> Zod](#-zod)

[🧑🏻‍💻 Contributing](#-contributing)
[📄 License](#-license)

</div>

---

## ✨ Features:

- 🎉 End-to-end TypeScript
- 🚫 Zero boilerplate
- 📡 Optional [server-sent events](https://en.wikipedia.org/wiki/Server-sent_events) support for real-time [subscriptions](#-subscriptions)
- 🪶 Extremely small client bundle size addition
- 🔗 Directly import and call tailored server functions from client code
- 📄 Colocate server and client files (or don't)
- 📦 Front-end and back-end framework agnostic
- 📦 Validation library agnostic
- 🚫 Low server overhead with no implicit run-time validations
- 🪝 Use the [composables](https://vuejs.org/guide/reusability/composables)/[hooks](https://react.dev/reference/react/hooks) pattern in server code
- 🔌 Includes adapters for popular libraries like [Hono](https://hono.dev/), [Vue](https://vuejs.org/) and [Zod](https://zod.dev/)
- 🧰 Includes utilities for [async server state](https://github.com/Makay11/SeamlessRPC/blob/main/lib/src/server/state.ts) and [results](https://github.com/Makay11/SeamlessRPC/blob/main/lib/src/result.ts)

## 🔧 Installation and setup

1. Install a single package:

   ```sh
   npm i seamlessrpc
   ```

   ```sh
   yarn add seamlessrpc
   ```

   ```sh
   pnpm add seamlessrpc
   ```

   ```sh
   bun add seamlessrpc
   ```

   Everything is included out-of-the-box!

2. Set up the Vite plugin:

   ```ts
   // vite.config.ts
   import { rpc } from "seamlessrpc/vite"
   import { defineConfig } from "vite"

   export default defineConfig({
     plugins: [
       rpc({
         url: "http://localhost:3000/rpc",
         credentials: "include",
       }),
     ],
   })
   ```

   You can run both `vite` to start a dev server or `vite build` to build for production.

3. Set up the RPC server (example using the included [Hono](https://hono.dev/) adapter):

   ```ts
   // src/server.ts
   import { serve } from "@hono/node-server"
   import { Hono } from "hono"
   import { cors } from "hono/cors"
   import { createRpc } from "seamlessrpc/hono"

   const app = new Hono()

   app.use(
     cors({
       origin: "http://localhost:5173",
       credentials: true,
     }),
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
     },
   )
   ```

   You can run the above file with `npx tsx src/server.ts`.

   You can also run `npx tsx watch src/server.ts` to auto-reload during development.

## 🚀 Usage

Create client and server files and seamlessly import server types and functions from client code with full TypeScript support!

```ts
// src/components/Todos.ts
import { createTodo, getTodos, type Todo } from "./Todos.server"

let todos: Todo[] = []

async function main() {
  todos = await getTodos()

  console.log(todos)

  const newTodo = await createTodo("New Todo")

  console.log(newTodo)
}

main()
```

```ts
// src/components/Todos.server.ts
export type Todo = {
  id: string
  text: string
}

const todos: Todo[] = []

export async function getTodos() {
  return todos
}

export async function createTodo(text: string) {
  // TODO validate text

  const todo = {
    id: crypto.randomUUID(),
    text,
  }

  todos.push(todo)

  return todo
}
```

Serve the above `src/components/Todos.ts` through Vite and you should see the array of todos printed to your browser console. Reload the page a bunch of times and you should see the array grow since the state is persisted in the server!

In a real scenario you would store your data in a database rather than in the server memory, of course. The snippets above are merely illustrative.

## 📝 Input validation

There is no implicit run-time validation of inputs in the server. In the example above, the function `createTodo` expects a single string argument. However, if your server is exposed publicly, bad actors or misconfigured clients might send something unexpected which can cause undefined behavior in you program.

Therefore, it is ⚠️ **extremely important** ⚠️ that you validate the inputs of all exposed function.

Here's a basic example using the included [Zod](https://zod.dev/) adapter:

```ts
import { z, zv } from "seamlessrpc/zod"

const TextSchema = z.string().min(1).max(256)

type Text = z.output<typeof TextSchema>

export async function createTodo(text: Text) {
  zv(text, TextSchema)

  // `text` is now safe to use
}
```

You can use any validation library or even your own custom code to validate your inputs since SeamlessRPC is completely agnostic. Just make sure to throw an instance of the included `ValidationError` so that the server responds with a `400 Bad Request` instead of the default `500 Internal Server Error`.

```ts
import { ValidationError } from "seamlessrpc/server"

export async function createTodo(text: string) {
  if (typeof text !== "string" || text.length < 1 || text.length > 256) {
    throw new ValidationError("Invalid text")
  }

  // `text` is now safe to use
}
```

If you are worried about forgetting to validate your inputs within the function, you can write a separate function signature with the expected types and then use `unknown` in the actual function implementation. The downside is that you have to explicitly provide a return type rather than letting it be inferred.

```ts
export async function createTodo(text: string): Promise<string>

export async function createTodo(text: unknown) {
  if (typeof text !== "string" || text.length < 1 || text.length > 256) {
    throw new ValidationError("Invalid text")
  }

  // `text` is now safe to use
}
```

## 🚨 Errors

WIP

## 📦 Async server state

WIP

## 👍 Results

WIP

## 📡 Subscriptions

WIP

## 🔌 Adapters

### <img src="icons/logos--hono.svg" alt="" height="18"> Hono

WIP

### <img src="icons/logos--vue.svg" alt="" height="18"> Vue

WIP

### <img src="icons/logos--zod.svg" alt="" height="18"> Zod

WIP

## 🧑🏻‍💻 Contributing

Contributions, issues, suggestions, ideas and discussions are all welcome!

This is an extremely young library and a lot can still change, be added and removed.

## 📄 License

[MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/)
