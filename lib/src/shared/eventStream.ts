import type { JsonValue } from "type-fest"

export type Setup<T extends JsonValue> = (controller: Controller<T>) => Cleanup

export type Controller<T extends JsonValue> = {
	enqueue: (value: T) => void
	close: () => void
	error: (error: Error) => void
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
