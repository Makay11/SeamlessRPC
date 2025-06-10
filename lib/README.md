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
- 📄 Co-locate client and server files (or don't 🤷)
- 📦 Front-end and back-end framework agnostic
- 📦 Validation library agnostic
- 🚫 Low server overhead with no implicit run-time validations
- 🧰 Includes utilities for [async server state](https://github.com/Makay11/SeamlessRPC/blob/main/lib/src/server/state.ts) and [results](https://github.com/Makay11/SeamlessRPC/blob/main/lib/src/result.ts)
- 🪝 Use the [composables](https://vuejs.org/guide/reusability/composables)/[hooks](https://react.dev/reference/react/hooks) pattern in server code
- 🔌 Includes adapters for popular libraries like [Hono](https://hono.dev/), [Vue](https://vuejs.org/) and [Zod](https://zod.dev/)

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

Therefore, it is ⚠️ **extremely important** ⚠️ that you validate the inputs of all exposed functions.

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

SeamlessRPC includes the following error classes:

- `RpcError`: The base error class for all SeamlessRPC errors.
- `InvalidRequestBodyError`: Thrown when the request body is invalid or cannot be parsed.
- `ValidationError`: Thrown when the input validation fails.
- `UnauthorizedError`: Thrown when the request is unauthorized.
- `ForbiddenError`: Thrown when the request is forbidden.
- `ProcedureNotFoundError`: Thrown when the requested procedure is not found.

You can throw any error in your functions:

```typescript
// src/components/Todos.server.ts
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from "seamlessrpc/server"

export async function createTodo(text: string) {
  // if text is invalid
  throw new ValidationError("Invalid text")

  // if user is not authenticated
  throw new UnauthorizedError()

  // if user is not allowed to perform an action
  throw new ForbiddenError()

  // custom error
  throw new Error("Something went wrong")
}
```

The included [Hono](https://hono.dev/) adapter maps errors to HTTP status codes in the following manner, by default:

- `RpcError` -> `500 Internal Server Error`
- `InvalidRequestBodyError` -> `400 Bad Request`
- `ValidationError` -> `400 Bad Request`
- `UnauthorizedError` -> `401 Unauthorized`
- `ForbiddenError` -> `403 Forbidden`
- `ProcedureNotFoundError` -> `404 Not Found`
- Custom errors -> `500 Internal Server Error`

However, it also allows you to provide a custom error handler to handle errors in a different way. This is covered in the [Hono section](#-hono) below.

## 📦 Async server state

SeamlessRPC provides a way to store temporary server state tied to a request. The state is stored within the server process using [AsyncLocalStorage](https://nodejs.org/docs/latest-v22.x/api/async_context.html#class-asynclocalstorage).

The state can be accessed from any function in a way that resembles the [composables](https://vuejs.org/guide/reusability/composables)/[hooks](https://react.dev/reference/react/hooks) pattern.

```typescript
// src/components/Example.server.ts
import { defineState } from "seamlessrpc/server"

export type User = {
  id: number
  name: string
}

const { createState, replaceState, clearState, useState, useStateOrThrow } =
  defineState<User>()

export async function example() {
  // throws if state has already been created
  let user = createState({
    id: 1,
    name: "John Doe",
  })

  // creates or replaces existing state
  user = replaceState({
    id: 2,
    name: "Jane Doe",
  })

  // clears state if it exists
  clearState()

  // returns undefined if state has not been created
  const maybeUser = useState()

  // throws if state has not been created
  user = useStateOrThrow()
}
```

Take a look at [sandbox/src/server/auth.ts](https://github.com/Makay11/SeamlessRPC/blob/main/sandbox/src/server/auth.ts) and [sandbox/src/components/OnlineChat.server.ts](https://github.com/Makay11/SeamlessRPC/blob/main/sandbox/src/components/OnlineChat.server.ts) for a full example of using async server state to implement basic authentication.

## 👍 Results

Results allow you to send fully typed serializable success or failure values back to the client.

You can create results using the `ok` and `err` functions.

```typescript
import { ok, err } from "seamlessrpc/result"

const successResult = ok("success")
// Ok<string> -> { ok: true, value: "success" }

const errorResult = err("failure")
// Err<string> -> { ok: false, error: "failure" }
```

For stronger typing you can use the `okConst` and `errConst` convenience functions.

```typescript
import { okConst, errConst } from "seamlessrpc/result"

// same as `ok("success" as const)`
const constSuccessResult = okConst("success")
// Ok<"success"> -> { ok: true, value: "success" }

// same as `err("failure" as const)`
const constErrorResult = errConst("failure")
// Err<"failure"> -> { ok: false, error: "failure" }
```

Here's a full example:

```typescript
import { ok, errConst } from "seamlessrpc/result"

export async function example() {
  if (someCondition) {
    return errConst("some_error")
  }

  return ok("success")
}

const result = await example()
// Err<"some_error"> | Ok<string>

if (result.ok) {
  // result: Ok<string>
  console.log(result.value) // "success"
} else {
  // result: Err<"some_error">
  console.error(result.error) // "some_error"
}
```

Take a look at [lib/src/result.ts](https://github.com/Makay11/SeamlessRPC/blob/main/lib/src/result.ts) for all the type definitions, including some helper types not mentioned here.

## 📡 Subscriptions

Subscriptions allow clients to receive real-time updates from the server via [server-sent events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

Client support needs to be explicitly enabled because it increases the client bundle size by a small amount.

```typescript
// vite.config.ts
import { rpc } from "seamlessrpc/vite"

export default defineConfig({
  plugins: [
    rpc({
      sse: true,
    }),
  ],
})
```

Then you can just return a [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) from your exposed server functions. These functions can still receive inputs and throw errors as usual. For convenience, SeamlessRPC provides a helper function `eventStream` that makes it easier to set up and clean up an event stream.

```typescript
// src/components/OnlineChat.server.ts
import { EventEmitter } from "node:events"

import { eventStream } from "seamlessrpc/server"

export type Message = {
  id: string
  topic: string
  text: string
}

// example event source
const events = new EventEmitter<{
  MESSAGE_CREATED: [message: Message]
}>()

setInterval(() => {
  events.emit("MESSAGE_CREATED", {
    topic: "general",
    text: "Hello, world!",
  })
}, 1000)

export async function useMessageCreatedEvents(topic: string) {
  // TODO validate topic
  // TODO check user auth

  return eventStream<Message>(({ enqueue }) => {
    console.log(`User subscribed`)
    events.on("MESSAGE_CREATED", onMessage)

    function onMessage(message: Message) {
      if (message.topic === topic) {
        enqueue(message)
      }
    }

    // return a cleanup function
    return () => {
      console.log(`User unsubscribed`)
      events.off("MESSAGE_CREATED", onMessage)
    }
  })
}
```

In your client code you can just read the [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) and handle the events as they come in. If you are using [Vue](https://vuejs.org), SeamlessRPC provides a `useSubscription` helper function; check the [Vue section](#-vue) below.

Take a look at [sandbox/src/components/OnlineChat.vue](https://github.com/Makay11/SeamlessRPC/blob/main/sandbox/src/components/OnlineChat.vue) and [sandbox/src/components/OnlineChat.server.ts](https://github.com/Makay11/SeamlessRPC/blob/main/sandbox/src/components/OnlineChat.server.ts) for a more advanced example.

## 🔌 Adapters

### <img src="icons/logos--hono.svg" alt="" height="18"> Hono

The Hono adapter allows you to use SeamlessRPC with a [Hono](https://honojs.dev) back-end.

```typescript
// src/server.ts
import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { createRpc } from "seamlessrpc/hono"

const app = new Hono()

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

The `createRpc` function accepts an optional object with the following optional properties:

- `onRequest`: an async function that is called before each RPC request
- `onError`: an async function that is called when an error occurs during an RPC request
- `files`: an object with the following optional properties:
  - `rootDir`: the root directory of the RPC files
  - `include`: file patterns to include
  - `exclude`: file patterns to exclude

```typescript
// src/server.ts
import { createRpc } from "seamlessrpc/hono"
import { RpcError, getHttpStatusCode } from "seamlessrpc/server"

const rpc = await createRpc({
  async onRequest(ctx) {
    // do something before each request
    // like initializing async server state
  },

  async onError(ctx, error) {
    // do something when an error occurs

    // log the error
    console.error(error)

    // keep default error handling behavior
    if (error instanceof RpcError) {
      return ctx.json(error, getHttpStatusCode(error))
    } else {
      throw error
    }

    // or send custom response
    return ctx.json("Something went wrong", 500)
  },

  files: {
    rootDir: "src",
    include: ["./**/*.server.ts"],
    exclude: ["./**/*.server.test.ts"],
  },
})
```

Check the [Errors section](#-errors) above for more information regarding the default error handling behavior.

### <img src="icons/logos--vue.svg" alt="" height="18"> Vue

SeamlessRPC includes a `useSubscription` helper function that makes it easier to handle subscriptions in [Vue](https://vuejs.org) applications. The function takes an object with the following properties:

- `source`: an async function that resolves with a [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- `onData`: a callback function that will be called whenever new data is received
- `onClose`: an optional callback function that will be called when the subscription is closed
- `onError`: an optional callback function that will be called if the subscription is closed with an error

```typescript
// script setup (or wrapped in a composable)
import { useSubscription } from "seamlessrpc/vue"

import { useMessageCreatedEvents } from "./OnlineChat.server"

const { isSubscribed, isSubscribing, subscribe, unsubscribe } = useSubscription(
  {
    source: async () => useMessageCreatedEvents("general"), // topic: "general"
    onData(message) {
      console.log(message)
    },
    onClose() {
      console.log("closed")
    },
    onError(error) {
      console.error(error)
    },
  },
)

onMounted(() => {
  subscribe().catch(console.error)
})

onBeforeUnmount(() => {
  unsubscribe().catch(console.error)
})
```

Take a look at [sandbox/src/components/OnlineChat.vue](https://github.com/Makay11/SeamlessRPC/blob/main/sandbox/src/components/OnlineChat.vue) for a more advanced example.

### <img src="icons/logos--zod.svg" alt="" height="18"> Zod

The Zod adapter allows you to use [Zod](https://zod.dev/) for input validation.

```typescript
// src/components/Todos.server.ts
import { z, zv } from "seamlessrpc/zod"

const TextSchema = z.string().min(1).max(256)

type Text = z.output<typeof TextSchema>

export async function createTodo(text: Text) {
  zv(text, TextSchema)

  // `text` is now safe to use
}
```

Check the [Input validation section](#-input-validation) above for more information.

## 🧑🏻‍💻 Contributing

Contributions, issues, suggestions, ideas and discussions are all welcome!

This is a very young library and a lot can still change.

## 📄 License

[MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/)
