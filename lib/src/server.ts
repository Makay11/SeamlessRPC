import { resolve } from "node:path"

import { glob } from "tinyglobby"
import type { JsonValue } from "type-fest"

import { UnknownProcedureError } from "./server/errors.js"
import { shortHash } from "./shared/shortHash.js"

export * from "./server/errors.js"
export * from "./server/state.js"
export * from "./shared/eventStream.js"

export type Options = {
	rootDir?: string | undefined
	include?: string | Array<string> | undefined
	exclude?: string | Array<string> | undefined
}

export type Procedure = (
	...args: Array<JsonValue>
) => Promise<JsonValue | ReadableStream<JsonValue>>

export async function createRpc({
	rootDir = "src",
	include = "**/*.server.ts",
	exclude = [],
}: Options = {}) {
	const proceduresMap = new Map<string, Procedure>()

	const paths = await glob({
		cwd: rootDir,
		patterns: include,
		ignore: exclude,
	})

	for (const path of paths) {
		const absolutePath = resolve(rootDir, path)

		const module = (await import(absolutePath)) as Record<string, Procedure>

		for (const exportName in module) {
			const procedure = module[exportName]!

			const procedureId = `${path}/${exportName}`
			const hashedProcedureId = `${shortHash(path)}/${exportName}`

			proceduresMap.set(procedureId, procedure)
			proceduresMap.set(hashedProcedureId, procedure)
		}
	}

	return async (procedureId: string, args: Array<JsonValue>) => {
		const procedure = proceduresMap.get(procedureId)

		if (procedure == null) {
			throw new UnknownProcedureError()
		}

		return procedure(...args)
	}
}
