import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"
import zlib from "node:zlib"

import type { Task } from "#/compression-worker.js"
import type { Options } from "#/index.js"

export type Format = "gzip" | "brotli" | "zstd"
export type OptionsMap = { gzip: ZlibOptions; brotli: BrotliOptions; zstd: ZstdOptions }

export abstract class Compressor<N extends Format> {
	abstract readonly name: N
	abstract readonly ext: string

	readonly opts: OptionsMap[N]

	protected abstract isEnabled(options: Options[N]): boolean
	protected abstract mergeOptions(options: Options[N]): OptionsMap[N]

	protected constructor(options: Options[N]) {
		this.opts = this.mergeOptions(options)
	}

	enabled(options: Options): boolean {
		return this.isEnabled(options[this.name])
	}

	task(file: string, source: ArrayBuffer, options: OptionsMap[N]): Task<N> {
		return { file, source, format: this.name, options }
	}
}

export class GzipCompressor extends Compressor<"gzip"> {
	readonly name = "gzip"
	readonly ext: string = "gz"

	constructor(options: Options) {
		super(options.gzip)
	}

	override isEnabled(options: Options["gzip"]): boolean {
		return options !== null && options !== false
	}

	override mergeOptions(options: Options["gzip"]): ZlibOptions {
		const defaults: ZlibOptions = { level: zlib.constants.Z_BEST_COMPRESSION }
		const opts = typeof options === "object" ? options : {}
		return { ...defaults, ...opts }
	}
}

export class BrotliCompressor extends Compressor<"brotli"> {
	readonly name = "brotli"
	readonly ext: string = "br"

	constructor(options: Options) {
		super(options.brotli)
	}

	override isEnabled(options: Options["brotli"]): boolean {
		return options !== null && options !== false
	}

	override mergeOptions(options: Options["brotli"]): BrotliOptions {
		const defaults: BrotliOptions = {
			params: {
				[zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
			},
		}
		const opts = typeof options === "object" ? options : {}
		return { ...defaults, ...opts, params: { ...defaults.params, ...opts.params } }
	}
}

export class ZstdCompressor extends Compressor<"zstd"> {
	readonly name = "zstd"
	readonly ext: string = "zst"

	constructor(options: Options) {
		super(options.zstd)
	}

	override isEnabled(options: Options["zstd"]): boolean {
		return typeof zlib.createZstdCompress === "function" && options !== null && options !== false
	}

	override mergeOptions(options: Options["zstd"]): ZstdOptions {
		const defaults: ZstdOptions = {
			params: {
				// 19 is the highest standard zstd level. Levels 20-22 exist, but they're "ultra"
				// levels that require significantly more memory for both compression
				// and decompression.
				[zlib.constants.ZSTD_c_compressionLevel]: 19,
			},
		}
		const opts = typeof options === "object" ? options : {}
		return { ...defaults, ...opts, params: { ...defaults.params, ...opts.params } }
	}
}

export const compressors = (options: Options): { [K in Format]: Compressor<K> } => ({
	brotli: new BrotliCompressor(options),
	gzip: new GzipCompressor(options),
	zstd: new ZstdCompressor(options),
})
