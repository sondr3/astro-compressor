import type { Dirent } from "node:fs"
import path from "node:path"

import type { AstroIntegrationLogger } from "astro"

import type { Format, OptionsMap } from "#/compressor.js"
import type { ResolvedOptions } from "#/index.js"
import { fileSize } from "#/utils.js"

export type HookResult = "keep" | "skip"

export const defaultFileExtensions = new Set([".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"])

export const defaultFileFilter = (extensions: Set<string>, entry: Dirent, logger: AstroIntegrationLogger): boolean => {
	if (!extensions.has(path.extname(entry.name))) {
		logger.debug(`skipping ${entry.name}`)
		return false
	}

	logger.debug(`keeping ${entry.name}`)
	return true
}

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

export interface FileFilter {
	entry: Dirent
	logger: AstroIntegrationLogger
}

export interface Hooks {
	/**
	 * A hook to allow you to filter out files before the compression even starts
	 */
	fileFilter?: (ctx: FileFilter) => boolean
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

export const defaultHooks: ResolvedOptions["hooks"] = {
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
}
