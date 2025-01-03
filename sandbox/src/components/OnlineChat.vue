<script setup lang="ts">
import { useAsyncState, whenever } from "@vueuse/core"
import { reactive, ref } from "vue"
import { useSubscription } from "@makay/rpc/vue"

import {
	createMessage,
	getMessages,
	getUser,
	login as _login,
	logout as _logout,
	useMessageCreatedEvents,
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
	shallow: false,
})

const messagesSubscription = reactive(
	useSubscription({
		source: useMessageCreatedEvents,
		onData(data) {
			messages.value.push(data)
		},
	})
)

whenever(
	() => user.value != null,
	async (_user, _, onCleanup) => {
		await fetchMessages()

		await messagesSubscription.subscribe()

		onCleanup(() => {
			messagesSubscription.unsubscribe().catch(console.error)
		})
	}
)

const newMessageText = ref("")

async function sendMessage() {
	if (newMessageText.value === "") return

	await createMessage(newMessageText.value)

	newMessageText.value = ""
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

		<div v-if="messagesSubscription.isSubscribing">Subscribing...</div>
		<div v-if="messagesSubscription.isSubscribed">Subscribed</div>
	</template>
</template>
