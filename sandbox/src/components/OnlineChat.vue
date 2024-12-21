<script setup lang="ts">
import { useAsyncState } from "@vueuse/core"
import { ref, watchEffect } from "vue"

import {
	createMessage,
	getMessages,
	getUser,
	login as _login,
	logout as _logout,
} from "./OnlineChat.server"

const { isLoading: isLoadingUser, state: user } = useAsyncState(getUser, null)

const username = ref("")

async function login() {
	user.value = await _login(username.value)
}

async function logout() {
	await _logout()
	user.value = null
}

const {
	isLoading: isLoadingMessages,
	state: messages,
	execute: fetchMessages,
} = useAsyncState(getMessages, [], {
	immediate: false,
	resetOnExecute: false,
})

// let unsubscribe: (() => void) | undefined

// onBeforeUnmount(() => {
// 	unsubscribe?.()
// })

watchEffect(async () => {
	if (user.value == null) {
		// unsubscribe?.()
		return
	}

	await fetchMessages()

	// const messageCreatedEvents = await useMessageCreatedEvents()

	// const reader = messageCreatedEvents.getReader()

	// for (;;) {
	// 	const { done, value } = await reader.read()

	// 	if (done) break

	// 	messages.value.push(value)
	// }
})

const newMessageText = ref("")

async function sendMessage() {
	if (newMessageText.value === "") return

	await createMessage(newMessageText.value)

	newMessageText.value = ""

	await fetchMessages()
}
</script>

<template>
	<div v-if="isLoadingUser">Loading...</div>

	<form
		v-else-if="user == null"
		@submit.prevent="login()"
	>
		<label>
			Username

			<input
				v-model="username"
				type="text"
			/>
		</label>

		<button type="submit">Login</button>
	</form>

	<template v-else>
		<div>Logged in as "{{ user.username }}" with id "{{ user.id }}"</div>

		<button @click="logout()">Logout</button>

		<ul>
			<li
				v-for="message in messages"
				:key="message.id"
			>
				{{ message.text }}
			</li>
		</ul>

		<form @submit.prevent="sendMessage()">
			<label>
				New message

				<input
					v-model="newMessageText"
					type="text"
				/>

				<button type="submit">Send</button>
			</label>
		</form>

		<div v-if="isLoadingMessages">Loading messages...</div>
	</template>
</template>
