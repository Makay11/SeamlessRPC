/* node:coverage disable */

import type { Procedure } from "../server.ts"

export async function importModule(path: string) {
	return import(path) as Promise<Record<string, Procedure>>
}
