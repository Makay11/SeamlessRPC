import type { JsonValue } from "type-fest"
import { computed, onBeforeUnmount, shallowRef } from "vue"

export type Args = Array<JsonValue>
export type Data = JsonValue

export type Source<TArgs extends Args, TData extends Data> = (
	...args: TArgs
) => Promise<ReadableStream<TData>>

export type OnData<TData extends Data> = (data: TData) => void
export type OnClose = () => void
export type OnError = (error: unknown) => void

export type Options<TArgs extends Args, TData extends Data> = {
	source: Source<TArgs, TData>
	onData: OnData<TData>
	onClose?: OnClose | undefined
	onError?: OnError | undefined
}

export function useSubscription<TArgs extends Args, TData extends Data>({
	source,
	onData,
	onClose,
	onError,
}: Options<TArgs, TData>) {
	const isSubscribing = shallowRef(false)
	const isSubscribed = shallowRef(false)

	let reader: ReadableStreamDefaultReader<TData> | undefined

	async function subscribe(...args: TArgs) {
		if (isSubscribing.value || isSubscribed.value) {
			throw new Error("Already subscribed.")
		}

		isSubscribing.value = true

		try {
			reader = (await source(...args)).getReader()

			isSubscribed.value = true

			listen()
				.then(onClose)
				.catch(onError ?? console.error)
				.finally(() => {
					isSubscribed.value = false
				})
		} finally {
			isSubscribing.value = false
		}
	}

	async function listen() {
		try {
			for (;;) {
				const { done, value } = await reader!.read()

				if (done) break

				onData(value)
			}
		} finally {
			reader!.releaseLock()
			reader = undefined
		}
	}

	async function unsubscribe() {
		await reader?.cancel()
	}

	onBeforeUnmount(() => {
		unsubscribe().catch(console.error)
	})

	/// keep-sorted
	return {
		isSubscribed: computed(() => isSubscribed.value),
		isSubscribing: computed(() => isSubscribing.value),
		subscribe,
		unsubscribe,
	}
}
