import { shortHash } from "./shortHash.js"
import { stripFileExtension } from "./stripFileExtension.js"

export function getProcedureId(relativeFilePath: string, exportName: string) {
	return `${stripFileExtension(relativeFilePath)}/${exportName}`
}

export function getHashedProcedureId(
	relativeFilePath: string,
	exportName: string,
) {
	return `${shortHash(stripFileExtension(relativeFilePath))}/${exportName}`
}
