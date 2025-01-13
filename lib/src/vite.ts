import { relative, resolve } from "node:path"

import { createFilter, parseAstAsync, type Plugin } from "vite"

import {
	DEFAULT_EXCLUDE,
	DEFAULT_INCLUDE,
	DEFAULT_ROOT_DIR,
} from "./shared/defaults.ts"
import { getHashedProcedureId, getProcedureId } from "./shared/procedureId.ts"

export type Options = {
	url?: string | undefined
	credentials?: RequestCredentials | undefined
	sse?: boolean | undefined
	rootDir?: string | undefined
	include?: string | Array<string> | undefined
	exclude?: string | Array<string> | undefined
	hashPaths?: boolean | undefined
}

type CreateExport = (id: string, name: string) => string

export function rpc({
	url = "/rpc",
	credentials = "same-origin",
	sse = false,
	rootDir = DEFAULT_ROOT_DIR,
	include = DEFAULT_INCLUDE,
	exclude = DEFAULT_EXCLUDE,
	hashPaths,
}: Options = {}) {
	let filter: (id: string) => boolean

	const _import = 'import { rpc } from "seamlessrpc/client"'

	let createExport: CreateExport

	return {
		name: "seamlessrpc",

		config(config) {
			config.define = {
				...config.define,
				$SEAMLESSRPC_URL: JSON.stringify(url),
				$SEAMLESSRPC_CREDENTIALS: JSON.stringify(credentials),
				$SEAMLESSRPC_SSE: JSON.stringify(sse),
			}
		},

		configResolved(config) {
			const rootPath = resolve(config.root, rootDir)

			filter = createFilter(include, exclude, {
				resolve: rootPath,
			})

			createExport = createExportFactory(
				rootPath,
				hashPaths ?? config.mode === "production",
			)
		},

		async transform(this: unknown, code, id) {
			if (!filter(id)) return

			const program = await parseAstAsync(code)

			const procedures = new Set<string>()

			for (const node of program.body) {
				if (node.type === "ExportDefaultDeclaration") {
					throw new Error(`Default exports are not allowed.`)
				}

				if (node.type === "ExportAllDeclaration") {
					throw new Error(`All exports must be local plain async functions.`)
				}

				if (node.type === "ExportNamedDeclaration") {
					if (
						node.declaration?.type !== "FunctionDeclaration" ||
						node.declaration.async !== true ||
						node.declaration.generator === true
					) {
						throw new Error(`All exports must be local plain async functions.`)
					}

					procedures.add(node.declaration.id.name)
				}
			}

			if (procedures.size === 0) {
				return "export {}"
			}

			const exports: Array<string> = []

			for (const procedure of procedures) {
				exports.push(createExport(id, procedure))
			}

			return `${_import}\n${exports.join("\n")}\n`
		},
	} as const satisfies Plugin
}

function createExportFactory(
	rootPath: string,
	hashPaths: boolean,
): CreateExport {
	const transformer = hashPaths ? getHashedProcedureId : getProcedureId

	return (id, name) => {
		const path = relative(rootPath, id)

		return `export const ${name} = rpc("${transformer(path, name)}")`
	}
}
