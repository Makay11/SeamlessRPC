import EventEmitter from "node:events"

import { eventStream } from "@makay/rpc/server"
import { z, zv } from "@makay/rpc/zod"

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

const ee = new EventEmitter<{
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

	ee.emit("MESSAGE_CREATED", message)

	return message
}

export async function useMessageCreatedEvents() {
	await useUserOrThrow()

	return eventStream<Message>((emit) => {
		ee.on("MESSAGE_CREATED", emit)

		return () => {
			ee.off("MESSAGE_CREATED", emit)
		}
	})
}
