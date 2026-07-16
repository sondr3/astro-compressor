import { promises as fs } from "node:fs"
import path from "node:path"

import type { AstroIntegrationLogger } from "astro"

import type { FileFilterParams } from "#/hooks.js"

export const findFiles = async (
	root: string,
	logger: AstroIntegrationLogger,
	filter: (ctx: FileFilterParams) => boolean,
): Promise<Array<string>> => {
	const entries = await fs.readdir(root, { withFileTypes: true, recursive: true })
	const files = entries
		.filter((p) => p.isFile())
		.filter((p) => filter({ filePath: path.resolve(p.parentPath, p.name), logger }))
		.map((p) => path.join(p.parentPath, p.name))
	const stats = await Promise.all(files.map(async (file) => ({ file, size: (await fs.stat(file)).size })))
	return stats.toSorted((a, b) => b.size - a.size).map(({ file }) => file)
}

// https://stackoverflow.com/a/41402498
export const fileSize = (b: number): string => {
	let res = b
	let u = 0
	const s = 1024
	const units = ["B", "KB", "MB", "GB"]

	while (res >= s || -res >= s) {
		res /= s
		u += 1
	}

	// oxlint-disable-next-line typescript/no-non-null-assertion
	return (u ? res.toFixed(1) : res) + units[u]!
}
