import type { JsonValue } from "type-fest"

export type Setup<T> = (emit: Emit<T>) => Cleanup

export type Emit<T> = (value: T) => void

export type Cleanup = () => void

export function eventStream<T extends JsonValue>(setup: Setup<T>) {
	let cleanup: Cleanup

	return new ReadableStream<T>({
		start(controller) {
			cleanup = setup((value) => {
				controller.enqueue(value)
			})
		},
		cancel() {
			cleanup()
		},
	})
}
