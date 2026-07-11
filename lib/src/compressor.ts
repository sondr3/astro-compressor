import { promisify } from "node:util"
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"
import * as zlib from "node:zlib"

import type { AstroIntegrationLogger } from "astro"

import type { Options } from "#/index.js"

type CompressionOptionsInner = ZlibOptions | BrotliOptions | ZstdOptions
type CompressorFn<O> = (source: Buffer, options: O) => Promise<Buffer>

abstract class Compressor<O extends CompressionOptionsInner> {
	abstract readonly name: string
	abstract readonly ext: string
	readonly enabled: boolean

	protected abstract compressor: CompressorFn<O>
	protected abstract readonly defaultOpts: O

	protected logger: AstroIntegrationLogger

	protected abstract isEnabled(options: Options): boolean

	constructor(logger: AstroIntegrationLogger, options: Options) {
		this.logger = logger
		this.enabled = this.isEnabled(options)
	}

	async compress(source: Buffer, options?: O): Promise<Buffer> {
		return this.compressor(source, { ...this.defaultOpts, ...options })
	}
}

export class GzipCompressor extends Compressor<ZlibOptions> {
	readonly name: string = "gzip"
	readonly ext: string = "gz"
	protected readonly defaultOpts: ZlibOptions = { level: zlib.constants.Z_BEST_COMPRESSION }
	protected compressor: CompressorFn<ZlibOptions> = promisify(zlib.gzip)

	protected override isEnabled(options: Options): boolean {
		return options.gzip !== null && options.gzip !== false
	}
}

export class BrotliCompressor extends Compressor<BrotliOptions> {
	readonly name: string = "brotli"
	readonly ext: string = "br"
	protected readonly defaultOpts: BrotliOptions = {
		params: {
			[zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
		},
	}
	protected compressor: CompressorFn<BrotliOptions> = promisify(zlib.brotliCompress)

	protected override isEnabled(options: Options): boolean {
		return options.brotli !== null && options.brotli !== false
	}
}

export class ZstdCompressor extends Compressor<ZstdOptions> {
	readonly name: string = "zstd"
	readonly ext: string = "zst"
	protected readonly defaultOpts: ZstdOptions = {
		params: {
			// 19 is the highest standard zstd level. Levels 20-22 exist, but they're "ultra"
			// levels that require significantly more memory for both compression
			// and decompression.
			[zlib.constants.ZSTD_c_compressionLevel]: 19,
		},
	}
	protected compressor: CompressorFn<ZstdOptions> = promisify(zlib.zstdCompress)

	protected override isEnabled(options: Options): boolean {
		return typeof zlib.createZstdCompress === "function" && options.zstd !== null && options.zstd !== false
	}
}
