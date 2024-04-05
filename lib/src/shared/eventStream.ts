type Setup<T> = (emit: Emit<T>) => Cleanup

type Emit<T> = (value: T) => void

type Cleanup = () => void

function eventStream<T extends JsonValue>(setup: Setup<T>) {
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

let interval: ReturnType<typeof setInterval> | undefined

const stream = eventStream<number>((emit) => {
	let i = 0

	interval = setInterval(() => {
		emit(i++)
	}, 1000)

	return () => {
		clearInterval(interval)
	}
})

setTimeout(async () => {
	const reader = stream.getReader()

	setTimeout(() => {
		reader.cancel()
	}, 3000)

	for (let result; (result = await reader.read()); ) {
		if (result.done) break

		console.log("received", result.value)
	}
}, 5000)
