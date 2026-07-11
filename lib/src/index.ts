import path from "node:path"
import { hrtime } from "node:process"
import { fileURLToPath } from "node:url"
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"

import type { AstroIntegration, AstroIntegrationLogger } from "astro"

import { CompressionWorker } from "#/worker.js"

export const defaultFileExtensions = new Set([".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"])

export type Format = "gzip" | "brotli" | "zstd"

export type HookResult = "keep" | "skip"

export interface PreCompressionOptions {
	filePath: string
	format: Format
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
		 * A pre-compression hook to run your own filter over the input files
		 */
		"compressor:file:before"?: (ctx: PreCompressionOptions) => HookResult | Promise<HookResult>
		/**
		 * A post-compression hook to run your own filter over the output files
		 */
		"compressor:file:after"?: (ctx: PostCompressionOptions) => HookResult | Promise<HookResult>
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

const defaultPreCompressionHook = (
	extensions: Set<string>,
	filePath: string,
	logger: AstroIntegrationLogger,
	format: Format,
): HookResult => {
	if (!extensions.has(path.extname(filePath))) {
		logger.debug(`skipping ${filePath}`)
		return "skip"
	}

	logger.debug(`compressing ${filePath} with ${format}`)
	return "keep"
}

const defaultOptions: Required<Omit<Options, "batchSize" | "fileExtensions">> = {
	gzip: true,
	brotli: true,
	zstd: true,
	hooks: {
		"compressor:file:before": ({ filePath, logger, format }) => {
			return defaultPreCompressionHook(defaultFileExtensions, filePath, logger, format)
		},
		"compressor:file:after": async ({ inputPath, inputSize, outputPath, outputSize, format, logger }) => {
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
	const options: Options = { ...defaultOptions, ...opts, hooks: { ...defaultOptions.hooks, ...opts?.hooks } }

	return {
		name: "astro-compressor",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				if (opts?.batchSize) {
					logger.warn(`'batchSize' is unused in astro-compressor@2, and will be removed in v2.1`)
				}

				if (opts?.fileExtensions) {
					logger.warn(`'fileExtensions' were superseded by hooks in astro-compressor@2, and will be removed in v2.1`)
					if (typeof opts.hooks?.["compressor:file:before"] === "function") {
						logger.error(`both 'fileExtensions' and 'compressor:file:before' defined, remove 'fileExtensions'`)
						throw new Error()
					}

					const oldstensions = new Set(opts.fileExtensions)
					options.hooks = {
						...options.hooks,
						"compressor:file:before": (params): HookResult => {
							return defaultPreCompressionHook(oldstensions, params.filePath, params.logger, params.format)
						},
					}
					logger.warn(`shimming 'compressor:file:before' hook with 'fileExtensions'`)
				}

				const root = fileURLToPath(dir)
				const worker = new CompressionWorker(root, logger, options)

				try {
					const start = hrtime.bigint()
					await worker.gather()
					await worker.compress()

					const end = hrtime.bigint()
					logger.info(`finished in ${(end - start) / BigInt(1000000)}ms\n`)
				} catch (e) {
					if (e instanceof Error) {
						logger.error(e.message)
					}
					throw e
				}
			},
		},
	}
}
