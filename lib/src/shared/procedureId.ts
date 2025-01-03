import { shortHash } from "./shortHash.ts"
import { stripFileExtension } from "./stripFileExtension.ts"

export function getProcedureId(relativeFilePath: string, exportName: string) {
	return `${stripFileExtension(relativeFilePath)}/${exportName}`
}

export function getHashedProcedureId(
	relativeFilePath: string,
	exportName: string,
) {
	return `${shortHash(stripFileExtension(relativeFilePath))}/${exportName}`
}
