import type { JsonValue } from "type-fest"

export type Setup<T extends JsonValue> = (controller: Controller<T>) => Cleanup

export type Controller<T extends JsonValue> = {
	enqueue: (value: T) => void
	close: () => void
	error: (error?: unknown) => void
}

export type Cleanup = () => void

export function eventStream<T extends JsonValue>(setup: Setup<T>) {
	let cleanup: Cleanup

	return new ReadableStream<T>({
		start(controller) {
			cleanup = setup({
				enqueue(value) {
					controller.enqueue(value)
				},
				close() {
					controller.close()
					cleanup()
				},
				error(error) {
					controller.error(error)
					cleanup()
				},
			})
		},
		cancel() {
			cleanup()
		},
	})
}

// const stream = eventStream<string>((ctrl) => {
// 	const interval = setInterval(() => {
// 		console.log("emit")
// 		ctrl.enqueue(new Date().toISOString())
// 		// ctrl.close()
// 		// ctrl.error("fake_error")
// 	}, 1000)

// 	return () => {
// 		console.log("clean up")
// 		clearInterval(interval)
// 	}
// })

// const reader = stream.getReader()

// try {
// 	for (let i = 0; ; i++) {
// 		const { done, value } = await reader.read()

// 		if (done) {
// 			console.log("close")
// 			break
// 		}

// 		console.log(value)

// 		if (i === 2) {
// 			console.log("cancel early")
// 			await reader.cancel()
// 			break
// 		}
// 	}
// } catch (error) {
// 	console.log("catch")
// 	console.error(error)
// } finally {
// 	console.log("finally")
// 	reader.releaseLock()
// 	console.log("all done")
// }
