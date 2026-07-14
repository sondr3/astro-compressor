import type { Dirent } from "node:fs"
import os from "node:os"
import path from "node:path"
import { hrtime } from "node:process"
import { fileURLToPath } from "node:url"
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"

import type { AstroIntegration, AstroIntegrationLogger } from "astro"

import type { TaskResponse } from "#/compression-worker.js"
import type { OptionsMap } from "#/compressor.js"
import { Queue } from "#/queue.js"
import { WorkerPool } from "#/worker-pool.js"
import { compressors, findFiles } from "#/worker.js"

export const defaultFileExtensions = new Set([".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"])

export type Format = "gzip" | "brotli" | "zstd"

export type HookResult = "keep" | "skip"

export interface PreCompressionOptions {
	filePath: string
	format: Format
	logger: AstroIntegrationLogger
}

export interface FileOptionsProps<N extends Format> {
	filePath: string
	format: N
	logger: AstroIntegrationLogger
}

export interface PostCompressionOptions {
	inputPath: string
	inputSize: number
	outputPath: string
	outputSize: number
	format: Format
	logger: AstroIntegrationLogger
}

export interface Options {
	/** Enable gzip compression */
	gzip?: boolean | ZlibOptions
	/** Enable brotli compression */
	brotli?: boolean | BrotliOptions
	/** Enable zstd compression */
	zstd?: boolean | ZstdOptions
	hooks?: {
		/**
		 * A hook to allow you to filter out files before the compression even starts
		 */
		fileFilter?: (ctx: { entry: Dirent; logger: AstroIntegrationLogger }) => boolean
		/**
		 * A pre-compression hook to run your own filter over the input files
		 */
		preCompression?: (ctx: PreCompressionOptions) => HookResult | Promise<HookResult | undefined> | undefined
		/**
		 * A hook to override options on a per-file basis
		 */
		fileOptions?: <N extends Format>(
			ctx: FileOptionsProps<N>,
		) => OptionsMap[N] | Promise<OptionsMap[N] | undefined> | undefined
		/**
		 * A post-compression hook to run your own filter over the output files
		 */
		postCompression?: (ctx: PostCompressionOptions) => HookResult | Promise<HookResult | undefined> | undefined
	}
	/**
	 * Extensions to compress, must be in the format `.html`, `.css` etc
	 *
	 * @deprecated Use the new hooks in v2
	 */
	fileExtensions?: Array<string>
	/**
	 * Number of files to batch process
	 *
	 * @deprecated Concurrency is handled internally in v2
	 */
	batchSize?: number
}

// I want a `NestedRequired` >:(
export type ResolvedOptions = Required<Omit<Options, "batchSize" | "fileExtensions" | "hooks">> & {
	hooks: Required<Omit<NonNullable<Options["hooks"]>, "fileOptions" | "preCompression">>
}

// https://stackoverflow.com/a/41402498
const fileSize = (b: number): string => {
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

const defaultFileFilter = (extensions: Set<string>, entry: Dirent, logger: AstroIntegrationLogger): boolean => {
	if (!extensions.has(path.extname(entry.name))) {
		logger.debug(`skipping ${entry.name}`)
		return false
	}

	logger.debug(`keeping ${entry.name}`)
	return true
}

const defaultOptions: ResolvedOptions = {
	gzip: true,
	brotli: true,
	zstd: true,
	hooks: {
		fileFilter: ({ entry, logger }): boolean => {
			return entry.isFile() && defaultFileFilter(defaultFileExtensions, entry, logger)
		},
		postCompression: async ({ inputPath, inputSize, outputPath, outputSize, format, logger }) => {
			if (outputSize >= inputSize) {
				logger.debug(`${outputPath} output size is larger than its input: ${outputSize} >= ${inputSize}`)
				return "skip"
			}

			logger.debug(`compressed ${inputPath} with ${format} from ${fileSize(inputSize)} to ${fileSize(outputSize)}`)
			return "keep"
		},
	},
}

// oxlint-disable-next-line unicorn/no-anonymous-default-export, import/no-default-export
export default function (opts: Options): AstroIntegration {
	const options: ResolvedOptions = { ...defaultOptions, ...opts, hooks: { ...defaultOptions.hooks, ...opts?.hooks } }

	return {
		name: "astro-compressor",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				if (opts?.batchSize) {
					logger.warn(`'batchSize' is unused in astro-compressor@2, and will be removed in v2.1`)
				}

				if (opts?.fileExtensions) {
					logger.warn(`'fileExtensions' were superseded by hooks in astro-compressor@2, and will be removed in v2.1`)
					if (typeof opts.hooks?.fileFilter === "function") {
						logger.error(`both 'fileExtensions' and 'fileFilter' defined, remove 'fileExtensions'`)
						throw new Error()
					}

					const oldstensions = new Set(opts.fileExtensions)
					options.hooks = {
						...options.hooks,
						fileFilter: (params): boolean => {
							return defaultFileFilter(oldstensions, params.entry, params.logger)
						},
					}
					logger.warn(`shimming 'fileFilter' hook with 'fileExtensions'`)
				}

				const { gzip, brotli, zstd } = compressors(options)
				const enabled = [brotli, gzip, zstd].filter((p) => p.enabled(options))
				const disabled = [brotli, gzip, zstd].filter((p) => !p.enabled(options))

				if (enabled.length === 0) {
					logger.warn(`no enabled formats, skipping :(`)
					return
				} else if (disabled.length === 0) {
					logger.info(`using ${enabled.map((p) => p.name).join(", ")}`)
				} else {
					logger.info(
						`using ${enabled.map((p) => p.name).join(", ")} (${disabled.map((p) => p.name).join(", ")} disabled)`,
					)
				}

				const root = fileURLToPath(dir)
				const pool = new WorkerPool<TaskResponse>()
				const queue = new Queue(pool, enabled, logger, options.hooks)

				try {
					const start = hrtime.bigint()
					const files = await findFiles(root, logger, options.hooks.fileFilter)

					let next = 0
					const consumer = async (): Promise<void> => {
						while (next < files.length) {
							// oxlint-disable-next-line no-plusplus typescript/no-non-null-assertion
							const file = files[next++]!
							// oxlint-disable-next-line no-await-in-loop
							await queue.processFile(file)
						}
					}

					await Promise.all(Array.from({ length: Math.min(os.availableParallelism() + 2, files.length) }, consumer))

					const end = hrtime.bigint()
					for (const compressor of enabled) {
						logger.info(`${compressor.name.padEnd(8, " ")} compressed ${queue.counter[compressor.name]} files`)
					}
					logger.info(`finished in ${(end - start) / BigInt(1000000)}ms\n`)
				} catch (e) {
					if (e instanceof Error) {
						logger.error(e.message)
					}
					throw e
				} finally {
					await pool.close()
				}
			},
		},
	}
}
