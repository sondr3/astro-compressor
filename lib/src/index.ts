import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { AstroIntegration, AstroIntegrationLogger } from "astro"

import type { BrotliOptions, ZlibOptions, ZstdOptions } from "./compress.js"
import { brotli, gzip, zstd } from "./compress.js"

export const defaultFileExtensions = new Set([".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"])

export type Format = "gzip" | "brotli" | "zstd"

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
	/** Number of files to batch process */
	batchSize?: number
	hooks?: {
		/**
		 * A pre-compression hook to run your own filter over the input files
		 */
		"compressor:file:before"?: (ctx: PreCompressionOptions) => boolean | Promise<boolean>
		/**
		 * A post-compression hook to run your own filter over the output files
		 */
		"compressor:file:after"?: (ctx: PostCompressionOptions) => void | Promise<void>
	}
}

const defaultOptions: Required<Options> = {
	gzip: true,
	brotli: true,
	zstd: true,
	batchSize: 10,
	hooks: {
		"compressor:file:before": ({ filePath, logger, format }) => {
			if (!defaultFileExtensions.has(path.extname(filePath))) {
				logger.debug(`skipping ${filePath}`)
				return false
			}
			logger.debug(`compressing ${filePath} with ${format}`)
			return true
		},
		"compressor:file:after": () => {
			return
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
				const entries = await fs.readdir(root, { withFileTypes: true, recursive: true })
				const files = entries.map((p) => path.join(p.parentPath, p.name))

				await Promise.allSettled([
					gzip(files, logger, options),
					brotli(files, logger, options),
					zstd(files, logger, options),
				])
				logger.info("Compression finished\n")
			},
		},
	}
}
