import { relative } from "node:path"

import {
	createFilter,
	parseAstAsync,
	type PluginOption,
	type ResolvedConfig,
} from "vite"

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
	let config: ResolvedConfig

	const _import = 'import { rpc } from "@makay/rpc/client"'

	let createExport: (path: string, name: string) => string

	function createExportFactory(hashPaths: boolean): typeof createExport {
		const transformer = hashPaths ? getHashedProcedureId : getProcedureId

		return (path, name) =>
			`export const ${name} = rpc("${transformer(path, name)}")`
	}

	let filter: (id: string) => boolean

	return {
		name: "@makay/rpc",

		config(config) {
			config.define = {
				...config.define,
				__MAKAY_RPC_SSE__: sse,
			}
		},

		configResolved(_config) {
			config = _config

			createExport = createExportFactory(
				hashPaths ?? config.mode === "production",
			)

			// TODO compute the resolve path based on config.root
			filter = createFilter(include, exclude, {
				resolve: rootDir,
			})
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

			console.log(config.root, id)

			const path = relative(config.root, id)

			for (const procedure of procedures) {
				exports.push(createExport(path, procedure))
			}

			return `${_import}\n${exports.join("\n")}\n`
		},
	}
}
