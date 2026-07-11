import fs from "node:fs/promises"
import { hrtime } from "node:process"
import { promisify } from "node:util"
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib"
import zlib from "node:zlib"

import type { AstroIntegrationLogger } from "astro"

import type { Format, Options } from "#/index.js"

type CompressionOptionsInner = ZlibOptions | BrotliOptions | ZstdOptions
type CompressorFn<O> = (source: Buffer, options: O) => Promise<Buffer>

abstract class Compressor<O extends CompressionOptionsInner> {
	abstract readonly name: Format
	abstract readonly ext: string
	readonly enabled: boolean

	protected abstract compressor: CompressorFn<O>

	protected readonly options: O
	protected hooks: Options["hooks"]
	protected logger: AstroIntegrationLogger

	compressed = 0

	protected abstract isEnabled(options: Options): boolean
	protected abstract mergeOptions(options: Options): O

	constructor(logger: AstroIntegrationLogger, options: Options) {
		this.logger = logger
		this.enabled = this.isEnabled(options)
		this.options = this.mergeOptions(options)
		this.hooks = options.hooks
	}

	async run(files: Array<string>, concurrency: number): Promise<void> {
		let next = 0
		const start = hrtime.bigint()

		const worker = async (): Promise<void> => {
			while (next < files.length) {
				// oxlint-disable-next-line no-plusplus typescript/no-non-null-assertion
				const file = files[next++]!
				// oxlint-disable-next-line no-await-in-loop
				await this.compress(file)
			}
		}

		await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker))

		const end = hrtime.bigint()
		this.logger.info(
			`${this.name.padEnd(8, " ")} compressed ${this.compressed} files in ${(end - start) / BigInt(1000000)}ms`,
		)
	}

	async compress(file: string): Promise<void> {
		if (typeof this.hooks?.["compressor:file:before"] === "function") {
			const shouldCompress = await this.hooks?.["compressor:file:before"]({
				filePath: file,
				logger: this.logger,
				format: this.name,
			})
			if (shouldCompress === "skip") return
			this.compressed += 1
		}

		const dest = `${file}.${this.ext}`
		const source = await fs.readFile(file)
		const compressed = await this.compressor(source, this.options)
		await fs.writeFile(dest, compressed)

		if (typeof this.hooks?.["compressor:file:after"] === "function") {
			const shouldRemove = await this.hooks?.["compressor:file:after"]({
				inputPath: file,
				inputSize: source.byteLength,
				outputPath: dest,
				outputSize: compressed.byteLength,
				format: this.name,
				logger: this.logger,
			})

			if (shouldRemove === "remove") {
				await fs.rm(dest, { recursive: false, force: false })
				this.compressed -= 1
			}
		}
	}
}

export class GzipCompressor extends Compressor<ZlibOptions> {
	readonly name: Format = "gzip"
	readonly ext: string = "gz"
	protected compressor: CompressorFn<ZlibOptions> = promisify(zlib.gzip)

	protected override isEnabled(options: Options): boolean {
		return options.gzip !== null && options.gzip !== false
	}

	protected override mergeOptions(options: Options): ZlibOptions {
		const defaults: ZlibOptions = { level: zlib.constants.Z_BEST_COMPRESSION }
		const opts = typeof options.gzip === "object" ? options.gzip : {}
		return {
			...defaults,
			...opts,
		}
	}
}

export class BrotliCompressor extends Compressor<BrotliOptions> {
	readonly name: Format = "brotli"
	readonly ext: string = "br"
	protected compressor: CompressorFn<BrotliOptions> = promisify(zlib.brotliCompress)

	protected override isEnabled(options: Options): boolean {
		return options.brotli !== null && options.brotli !== false
	}

	protected override mergeOptions(options: Options): BrotliOptions {
		const defaults: BrotliOptions = {
			params: {
				[zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
			},
		}
		const opts = typeof options.brotli === "object" ? options.brotli : {}
		return {
			...defaults,
			...opts,
			params: {
				...defaults.params,
				...opts.params,
			},
		}
	}
}

export class ZstdCompressor extends Compressor<ZstdOptions> {
	readonly name: Format = "zstd"
	readonly ext: string = "zst"
	protected compressor: CompressorFn<ZstdOptions> = promisify(zlib.zstdCompress)

	protected override isEnabled(options: Options): boolean {
		return typeof zlib.createZstdCompress === "function" && options.zstd !== null && options.zstd !== false
	}

	protected override mergeOptions(options: Options): ZstdOptions {
		const defaults: ZstdOptions = {
			params: {
				// 19 is the highest standard zstd level. Levels 20-22 exist, but they're "ultra"
				// levels that require significantly more memory for both compression
				// and decompression.
				[zlib.constants.ZSTD_c_compressionLevel]: 19,
			},
		}
		const opts = typeof options.zstd === "object" ? options.zstd : {}
		return {
			...defaults,
			...opts,
			params: {
				...defaults.params,
				...opts.params,
			},
		}
	}
}
