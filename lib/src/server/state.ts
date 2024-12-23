import { AsyncLocalStorage } from "node:async_hooks"

const asyncLocalStorage = new AsyncLocalStorage<Map<symbol, unknown>>()

export function runWithStore<T>(fn: () => T) {
	if (asyncLocalStorage.getStore() != null) {
		throw new Error("Store has already been created.")
	}

	return asyncLocalStorage.run(new Map<symbol, unknown>(), fn)
}

function getStoreOrThrow() {
	const store = asyncLocalStorage.getStore()

	if (store == null) {
		throw new Error("Store has not been created.")
	}

	return store
}

export function defineState<State extends NonNullable<unknown>>() {
	const symbol = Symbol()

	function createState(state: State) {
		const store = getStoreOrThrow()

		if (store.has(symbol)) {
			throw new Error("State has already been created.")
		}

		store.set(symbol, state)

		return state
	}

	function replaceState(state: State) {
		const store = getStoreOrThrow()

		store.set(symbol, state)

		return state
	}

	function clearState() {
		const store = getStoreOrThrow()

		store.delete(symbol)
	}

	function useState() {
		const store = getStoreOrThrow()

		return store.get(symbol) as State | undefined
	}

	function useStateOrThrow() {
		const state = useState()

		if (state == null) {
			throw new Error("State has not been created.")
		}

		return state
	}

	return {
		createState,
		replaceState,
		clearState,
		useState,
		useStateOrThrow,
	}
}
