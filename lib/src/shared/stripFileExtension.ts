export function stripFileExtension(path: string) {
	return path.replace(/\.[^/.]+$/, "")
}
