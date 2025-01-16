import EventEmitter from "node:events"

import { eventStream } from "seamlessrpc/server"
import { z, zv } from "seamlessrpc/zod"

import {
	login as _login,
	logout as _logout,
	UserSchema,
	useUser,
	useUserOrThrow,
} from "../server/auth"

export async function getUser() {
	return useUser()
}

const UsernameSchema = UserSchema.shape.username

export async function login(username: string) {
	zv(username, UsernameSchema)

	return _login(username)
}

export async function logout() {
	_logout()
}

export type Message = {
	id: string
	text: string
	senderId: string
}

const messages: Message[] = []

export async function getMessages() {
	await useUserOrThrow()

	return messages
}

const events = new EventEmitter<{
	MESSAGE_CREATED: [message: Message]
}>()

const TextSchema = z.string().min(1).max(256)
type Text = z.infer<typeof TextSchema>

export async function createMessage(text: Text) {
	zv(text, TextSchema)

	const user = await useUserOrThrow()

	const message: Message = {
		id: crypto.randomUUID(),
		text,
		senderId: user.id,
	}

	messages.push(message)

	events.emit("MESSAGE_CREATED", message)

	return message
}

export async function useMessageCreatedEvents() {
	const user = await useUserOrThrow()

	return eventStream<Message>(({ enqueue }) => {
		console.log(`User "${user.username}" subscribed`)
		events.on("MESSAGE_CREATED", enqueue)

		return () => {
			console.log(`User "${user.username}" unsubscribed`)
			events.off("MESSAGE_CREATED", enqueue)
		}
	})
}
