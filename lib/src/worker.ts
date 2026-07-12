import { type Dirent, promises as fs } from "node:fs"
import path from "node:path"

import type { AstroIntegrationLogger } from "astro"

import type { TaskResponse } from "#/compression-worker.js"
import { BrotliCompressor, Compressor, GzipCompressor, type OptionsMap, ZstdCompressor } from "#/compressor.js"
import type { Format, Options } from "#/index.js"
import type { WorkerPool } from "#/worker-pool.js"

export const compressors: { [K in Format]: Compressor<K> } = {
	brotli: new BrotliCompressor(),
	gzip: new GzipCompressor(),
	zstd: new ZstdCompressor(),
}

export const findFiles = async (
	root: string,
	logger: AstroIntegrationLogger,
	filter: (ctx: { entry: Dirent; logger: AstroIntegrationLogger }) => boolean,
): Promise<Array<string>> => {
	const entries = await fs.readdir(root, { withFileTypes: true, recursive: true })
	const files = entries
		.filter((p) => p.isFile() && filter({ entry: p, logger }))
		.map((p) => path.join(p.parentPath, p.name))
	const stats = await Promise.all(files.map(async (file) => ({ file, size: (await fs.stat(file)).size })))
	return stats.toSorted((a, b) => b.size - a.size).map(({ file }) => file)
}

export const queueTask = async <N extends Format>(
	file: string,
	compressor: Compressor<N>,
	options: OptionsMap[N],
	pool: WorkerPool<TaskResponse>,
	logger: AstroIntegrationLogger,
	hooks?: Options["hooks"],
): Promise<void> => {
	if (typeof hooks?.["compressor:file:before"] === "function") {
		const shouldCompress = await hooks?.["compressor:file:before"]({
			filePath: file,
			logger: logger,
			format: compressor.name,
		})
		if (shouldCompress === "skip") return
	}

	const source = await fs.readFile(file)
	const inputSize = source.byteLength
	const res = await pool.execute({
		file: file,
		source: source.buffer,
		options: options,
		format: compressor.name,
	})

	const shouldRemove =
		typeof hooks?.["compressor:file:after"] === "function"
			? await hooks?.["compressor:file:after"]({
					inputPath: file,
					inputSize,
					outputPath: `${file}.${compressor.ext}`,
					outputSize: res.output.byteLength,
					format: compressor.name,
					logger: logger,
				})
			: "keep"

	if (shouldRemove === "keep") {
		await fs.writeFile(`${file}.${compressor.ext}`, Buffer.from(res.output))
	}
}
