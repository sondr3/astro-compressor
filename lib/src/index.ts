import path from "node:path"
import { hrtime } from "node:process"
import { fileURLToPath } from "node:url"
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"

import type { AstroIntegration, AstroIntegrationLogger } from "astro"

import { CompressionWorker } from "#/worker.js"

export const defaultFileExtensions = new Set([".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"])

export type Format = "gzip" | "brotli" | "zstd"

export type PreHookResult = "keep" | "skip"
export type PostHookResult = "keep" | "remove"

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
		"compressor:file:before"?: (ctx: PreCompressionOptions) => PreHookResult | Promise<PreHookResult>
		/**
		 * A post-compression hook to run your own filter over the output files
		 */
		"compressor:file:after"?: (ctx: PostCompressionOptions) => PostHookResult | Promise<PostHookResult>
	}
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

const defaultOptions: Required<Options> = {
	gzip: true,
	brotli: true,
	zstd: true,
	hooks: {
		"compressor:file:before": ({ filePath, logger, format }) => {
			if (!defaultFileExtensions.has(path.extname(filePath))) {
				logger.debug(`skipping ${filePath}`)
				return "skip"
			}

			logger.debug(`compressing ${filePath} with ${format}`)
			return "keep"
		},
		"compressor:file:after": async ({ inputPath, inputSize, outputPath, outputSize, format, logger }) => {
			if (outputSize >= inputSize) {
				logger.debug(`${outputPath} output size is larger than its input: ${outputSize} >= ${inputSize}`)
				return "remove"
			}

			logger.debug(`compressed ${inputPath} with ${format} from ${fileSize(inputSize)} to ${fileSize(outputSize)} b`)
			return "keep"
		},
	},
}

// oxlint-disable-next-line unicorn/no-anonymous-default-export, import/no-default-export
export default function (opts: Options = defaultOptions): AstroIntegration {
	const options = { ...defaultOptions, ...opts }

	return {
		name: "astro-compressor",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
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
						throw e
					}
				}
			},
		},
	}
}
