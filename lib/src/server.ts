import { resolve } from "node:path"

import { glob } from "tinyglobby"
import type { JsonValue } from "type-fest"

import { ProcedureNotFoundError } from "./server/errors.ts"
import {
	DEFAULT_EXCLUDE,
	DEFAULT_INCLUDE,
	DEFAULT_ROOT_DIR,
} from "./shared/defaults.ts"
import { getHashedProcedureId, getProcedureId } from "./shared/procedureId.ts"

export * from "./server/errors.ts"
export * from "./server/state.ts"
export * from "./shared/eventStream.ts"

export type Options = {
	rootDir?: string | undefined
	include?: string | Array<string> | undefined
	exclude?: string | Array<string> | undefined
}

export type Procedure = (
	...args: Array<JsonValue>
) => Promise<JsonValue | ReadableStream<JsonValue> | void> // eslint-disable-line @typescript-eslint/no-invalid-void-type

export async function createRpc({
	rootDir = DEFAULT_ROOT_DIR,
	include = DEFAULT_INCLUDE,
	exclude = DEFAULT_EXCLUDE,
}: Options = {}) {
	const proceduresMap = new Map<string, Procedure>()

	const paths = await glob({
		cwd: rootDir,
		patterns: include,
		ignore: exclude,
	})

	await Promise.all(
		paths.map(async (path) => {
			const absolutePath = resolve(rootDir, path)

			const module = (await import(absolutePath)) as Record<string, Procedure>

			for (const exportName in module) {
				const procedure = module[exportName]!

				const ids = [
					getProcedureId(path, exportName),
					getHashedProcedureId(path, exportName),
				]

				for (const id of ids) {
					if (proceduresMap.has(id)) {
						throw new Error(`Procedure "${id}" is already defined.`)
					}

					proceduresMap.set(id, procedure)
				}
			}
		}),
	)

	return async (procedureId: string, args: Array<JsonValue>) => {
		const procedure = proceduresMap.get(procedureId)

		if (procedure == null) {
			throw new ProcedureNotFoundError()
		}

		return procedure(...args)
	}
}
