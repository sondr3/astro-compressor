import type { AstroIntegrationLogger } from "astro"

import { BrotliCompressor, GzipCompressor, ZstdCompressor } from "#/compressor.js"
import type { Format, Options } from "#/index.js"

export class CompressionWorker {
	brotli: BrotliCompressor
	gzip: GzipCompressor
	zstd: ZstdCompressor

	protected readonly logger: AstroIntegrationLogger

	constructor(logger: AstroIntegrationLogger, options: Options) {
		this.brotli = new BrotliCompressor(logger, options)
		this.gzip = new GzipCompressor(logger, options)
		this.zstd = new ZstdCompressor(logger, options)
		this.logger = logger
	}

	logInit(): void {
		const formats = this.enabledCompressors
		const enabled = Object.entries(formats)
			.filter(([_, e]) => e)
			.map(([n, _]) => n)
		const disabled = Object.entries(formats)
			.filter(([_, e]) => !e)
			.map(([n, _]) => n)

		if (enabled.length === 0) {
			this.logger.warn(`no enabled formats, skipping :(`)
		} else if (disabled.length === 0) {
			this.logger.info(`compressing with ${enabled.join(", ")}`)
		} else {
			this.logger.info(`compressing with ${enabled.join(", ")} (${disabled.join(", ")} disabled)`)
		}
	}

	public get enabledCompressors(): Record<Format, boolean> {
		return {
			brotli: this.brotli.enabled,
			gzip: this.gzip.enabled,
			zstd: this.zstd.enabled,
		}
	}
}
