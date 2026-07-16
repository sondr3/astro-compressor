import path from "node:path"

import type { AstroIntegrationLogger } from "astro"

import type { Format, OptionsMap } from "#/compressor.js"
import type { ResolvedOptions } from "#/index.js"
import { fileSize } from "#/utils.js"

export type KeepOrSkip = "keep" | "skip"
export type HookResult = KeepOrSkip | Promise<KeepOrSkip | undefined> | undefined

export const defaultFileExtensions = new Set([".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"])

export const defaultFileFilter = (
	extensions: Set<string>,
	filePath: string,
	logger: AstroIntegrationLogger,
): boolean => {
	if (!extensions.has(path.extname(filePath))) {
		logger.debug(`skipping ${filePath}`)
		return false
	}

	logger.debug(`keeping ${filePath}`)
	return true
}

export interface PreCompressionParams {
	filePath: string
	format: Format
	logger: AstroIntegrationLogger
}

export type FileOptionsResult<N extends Format> = OptionsMap[N] | Promise<OptionsMap[N] | undefined> | undefined
export interface FileOptionsParams {
	filePath: string
	logger: AstroIntegrationLogger
}

export interface PostCompressionParams {
	inputPath: string
	inputSize: number
	outputPath: string
	outputSize: number
	format: Format
	logger: AstroIntegrationLogger
}

export interface FileFilterParams {
	filePath: string
	logger: AstroIntegrationLogger
}

export interface Hooks {
	/**
	 * This hook allows you to customize what files are included in the compression. By
	 * default, it uses the 'defaultFileFilter' function with 'defaultFileExtensions' as the
	 * filter, keeping only files with a certain set of extensions.
	 */
	fileFilter?: (ctx: FileFilterParams) => boolean
	/**
	 * A pre-compression hook that allows you to change your mind about compressing
	 * a specific file in a specific format. In other words, you can include all SVGs via
	 * the `fileFilter` hook but skip compressing them with `brotli` for example. Or
	 * can be used to trace what files are compressed using the supplied `logger` instance.
	 *
	 * Returning `undefined` means the file is kept.
	 */
	preCompression?: (ctx: PreCompressionParams) => HookResult
	/**
	 * A pre-compression hook that allows you to customize the options on a per file
	 * and per format basis. As with the `preCompression` hook you could for example
	 * use less aggressive options for certain files to avoid spending time on them.
	 *
	 * This hooks is a little awkward and will reduce the performance a bit, but gives
	 * you full control.
	 *
	 * Returning `undefined` falls back to the default options or your own configuration.
	 */
	fileOptions?: {
		[K in Format]?: (ctx: FileOptionsParams) => FileOptionsResult<K>
	}
	/**
	 * A post-compression hook that allows you to do a final decision on whether to
	 * save a compressed file. If you only want to save file that are compressed above
	 * a certain threshold this can be useful.
	 *
	 * The default implementation is `if (outputSize >= inputSize) "skip"`, so compressed files
	 * that are larger than their input is skipped
	 *
	 * Returning `undefined` means the file is kept.
	 */
	postCompression?: (ctx: PostCompressionParams) => HookResult
}

export const defaultHooks: ResolvedOptions["hooks"] = {
	fileFilter: ({ filePath, logger }): boolean => {
		return defaultFileFilter(defaultFileExtensions, filePath, logger)
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
