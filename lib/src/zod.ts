import type { z } from "zod"

import { ValidationError } from "./server.ts"

export * from "zod"

// eslint-disable-next-line @typescript-eslint/no-deprecated
export function zv<Schema extends z.ZodTypeAny>(
	value: unknown,
	schema: Schema,
): asserts value is z.infer<Schema> {
	const result = schema.safeParse(value)

	if (!result.success) {
		// eslint-disable-next-line @typescript-eslint/no-deprecated
		throw new ValidationError(result.error.format())
	}
}
