import { relative, resolve } from "node:path"

import { createFilter, parseAstAsync, type PluginOption } from "vite"

import {
	DEFAULT_EXCLUDE,
	DEFAULT_INCLUDE,
	DEFAULT_ROOT_DIR,
} from "./shared/defaults.js"
import { getHashedProcedureId, getProcedureId } from "./shared/procedureId.js"

export type Options = {
	rootDir?: string | undefined
	include?: string | Array<string> | undefined
	exclude?: string | Array<string> | undefined
	hashPaths?: boolean | undefined
	sse?: boolean | undefined
}

export function rpc({
	rootDir = DEFAULT_ROOT_DIR,
	include = DEFAULT_INCLUDE,
	exclude = DEFAULT_EXCLUDE,
	hashPaths,
	sse = false,
}: Options = {}): PluginOption {
	let filter: (id: string) => boolean

	const _import = 'import { rpc } from "@makay/rpc/client"'

	let createExport: (id: string, name: string) => string

	function createExportFactory(
		rootPath: string,
		hashPaths: boolean,
	): typeof createExport {
		const transformer = hashPaths ? getHashedProcedureId : getProcedureId

		return (id, name) => {
			const path = relative(rootPath, id)

			return `export const ${name} = rpc("${transformer(path, name)}")`
		}
	}

	return {
		name: "@makay/rpc",

		config(config) {
			config.define = {
				...config.define,
				__MAKAY_RPC_SSE__: sse,
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

		async transform(code, id) {
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
	}
}
