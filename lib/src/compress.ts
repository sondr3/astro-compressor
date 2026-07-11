import { createReadStream, createWriteStream } from "node:fs"
import { promises as fs } from "node:fs"
import { hrtime } from "node:process"
import { promises as stream } from "node:stream"
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"
import * as zlib from "node:zlib"

import type { AstroIntegrationLogger } from "astro"

import type { Options } from "#/index.js"

export type { BrotliOptions, ZlibOptions, ZstdOptions }

type CompressionOptionsInner = ZlibOptions | BrotliOptions | ZstdOptions

interface CompressionOptions<O = CompressionOptionsInner> {
	files: Array<string>
	batchSize: number
	enabled: boolean | undefined
	options?: O | undefined
	hooks?: Options["hooks"]
}

const mergeOptions = <T extends CompressionOptionsInner>(defaults: T, overrides: T | boolean | undefined): T => ({
	...defaults,
	...(typeof overrides === "object" ? overrides : {}),
})

const compress = async <O extends CompressionOptionsInner>(
	name: "gzip" | "brotli" | "zstd",
	compressedFileNames: string,
	compressor: (options: O | undefined) => NodeJS.ReadWriteStream,
	logger: AstroIntegrationLogger,
	{ files, batchSize, enabled, options, hooks }: CompressionOptions<O>,
): Promise<void> => {
	if (!enabled) {
		logger.warn(`${name} compression disabled, skipping...`)
		return
	}

	let compressed = 0
	const start = hrtime.bigint()
	for (let i = 0; i < files.length; i += batchSize) {
		const batch = files.slice(i, i + batchSize)
		// oxlint-disable-next-line no-await-in-loop, intentional batching
		await Promise.all(
			batch.map(async (file) => {
				if (typeof hooks?.["compressor:file:before"] === "function") {
					const shouldCompress = await hooks?.["compressor:file:before"]({ filePath: file, logger, format: name })
					if (shouldCompress === "skip") return
				}

				compressed += 1
				const outputFile = `${file}.${compressedFileNames}`
				const source = createReadStream(file)
				const destination = createWriteStream(outputFile)
				const comp = compressor(options)
				await stream.pipeline(source, comp, destination)

				if (typeof hooks?.["compressor:file:after"] === "function") {
					const shouldRemove = await hooks?.["compressor:file:after"]({
						inputPath: file,
						inputSize: source.bytesRead,
						outputPath: outputFile,
						outputSize: destination.bytesWritten,
						format: name,
						logger,
					})

					if (shouldRemove === "remove") {
						await fs.rm(outputFile, { recursive: false, force: false })
						compressed -= 1
					}
				}
			}),
		)
	}

	const end = hrtime.bigint()
	logger.info(`${name.padEnd(8, " ")} compressed ${compressed} files in ${(end - start) / BigInt(1000000)}ms`)
}

export const gzip = async (files: Array<string>, logger: AstroIntegrationLogger, options: Options): Promise<void> => {
	await compress("gzip", "gz", zlib.createGzip, logger, {
		files,
		enabled: options.gzip === true || typeof options.gzip === "object",
		options: mergeOptions({ level: zlib.constants.Z_BEST_COMPRESSION }, options.gzip),
		batchSize: options.batchSize ?? 10,
		hooks: options.hooks,
	})
}

export const brotli = async (files: Array<string>, logger: AstroIntegrationLogger, options: Options): Promise<void> => {
	await compress("brotli", "br", zlib.createBrotliCompress, logger, {
		files,
		enabled: options.brotli === true || typeof options.brotli === "object",
		options: mergeOptions(
			{
				params: {
					[zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
				},
			},
			options.brotli,
		),
		batchSize: options.batchSize ?? 10,
		hooks: options.hooks,
	})
}

export const zstd = async (files: Array<string>, logger: AstroIntegrationLogger, options: Options): Promise<void> => {
	await compress("zstd", "zst", zlib.createZstdCompress, logger, {
		files,
		enabled: options.zstd === true || typeof options.zstd === "object",
		options: mergeOptions(
			{
				params: {
					// 19 is the highest standard zstd level. Levels 20-22 exist, but they're "ultra"
					// levels that require significantly more memory for both compression
					// and decompression.
					[zlib.constants.ZSTD_c_compressionLevel]: 19,
				},
			},
			options.zstd,
		),
		batchSize: options.batchSize ?? 10,
		hooks: options.hooks,
	})
}
