import os from "node:os"
import { hrtime } from "node:process"
import { fileURLToPath } from "node:url"
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"

import type { AstroIntegration } from "astro"

import { compressors } from "#/compressor.js"
import { defaultFileFilter, defaultHooks, type Hooks } from "#/hooks.js"
import { Queue } from "#/queue.js"
import { findFiles } from "#/utils.js"
import { WorkerPool } from "#/worker-pool.js"

export type {
	Hooks,
	FileFilterParams,
	PreCompressionParams,
	PostCompressionParams,
	HookResult,
	KeepOrSkip,
	FileOptionsParams,
} from "#/hooks.js"
export { gzipDefaults, brotliDefaults, zstdDefaults } from "#/compressor.js"
export { defaultFileFilter, defaultFileExtensions } from "#/hooks.js"

export interface Options {
	/** Enable and/or configure gzip compression */
	gzip?: boolean | ZlibOptions
	/** Enable and/or configure brotli compression */
	brotli?: boolean | BrotliOptions
	/** Enable and/or configure zstd compression */
	zstd?: boolean | ZstdOptions
	/** Hooks are a way to influence what is compressed and how */
	hooks?: Hooks
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

const defaultOptions: ResolvedOptions = {
	gzip: true,
	brotli: true,
	zstd: true,
	hooks: defaultHooks,
}

// oxlint-disable-next-line unicorn/no-anonymous-default-export, import/no-default-export
export default function (opts?: Options): AstroIntegration {
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
							return defaultFileFilter(oldstensions, params.filePath, params.logger)
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
				const pool = new WorkerPool()
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
