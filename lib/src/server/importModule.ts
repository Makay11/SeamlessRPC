import type { Procedure } from "../server.ts"

// TODO mocking non-existent modules does not work at the moment with node:test
/* node:coverage ignore next 3 */
export async function importModule(path: string) {
	return import(path) as Promise<Record<string, Procedure>>
}
