import { type Dirent, promises as fs } from "node:fs"
import path from "node:path"

import type { AstroIntegrationLogger } from "astro"

import { BrotliCompressor, Compressor, GzipCompressor, ZstdCompressor } from "#/compressor.js"
import type { Format, Options } from "#/index.js"

export const compressors = (options: Options): { [K in Format]: Compressor<K> } => ({
	brotli: new BrotliCompressor(options),
	gzip: new GzipCompressor(options),
	zstd: new ZstdCompressor(options),
})

export const findFiles = async (
	root: string,
	logger: AstroIntegrationLogger,
	filter: (ctx: { entry: Dirent; logger: AstroIntegrationLogger }) => boolean,
): Promise<Array<string>> => {
	const entries = await fs.readdir(root, { withFileTypes: true, recursive: true })
	const files = entries.filter((p) => filter({ entry: p, logger })).map((p) => path.join(p.parentPath, p.name))
	const stats = await Promise.all(files.map(async (file) => ({ file, size: (await fs.stat(file)).size })))
	return stats.toSorted((a, b) => b.size - a.size).map(({ file }) => file)
}
