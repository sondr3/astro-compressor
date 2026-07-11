import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

import type { AstroIntegrationLogger } from "astro"

import { BrotliCompressor, GzipCompressor, ZstdCompressor } from "#/compressor.js"
import type { Format, Options } from "#/index.js"

export class CompressionWorker {
	brotli: BrotliCompressor
	gzip: GzipCompressor
	zstd: ZstdCompressor

	protected readonly logger: AstroIntegrationLogger
	protected readonly root: string
	protected readonly concurrency = os.availableParallelism()

	files: Array<string> = []

	constructor(root: string, logger: AstroIntegrationLogger, options: Options) {
		this.logger = logger
		this.root = root

		this.brotli = new BrotliCompressor(logger, options)
		this.gzip = new GzipCompressor(logger, options)
		this.zstd = new ZstdCompressor(logger, options)

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
			this.logger.info(`using ${enabled.join(", ")}`)
		} else {
			this.logger.info(`using ${enabled.join(", ")} (${disabled.join(", ")} disabled)`)
		}
	}

	async gather(): Promise<void> {
		const entries = await fs.readdir(this.root, { withFileTypes: true, recursive: true })
		const files = entries.map((p) => path.join(p.parentPath, p.name))
		const stats = await Promise.all(files.map(async (file) => ({ file, size: (await fs.stat(file)).size })))
		this.files = stats.toSorted((a, b) => b.size - a.size).map(({ file }) => file)
	}

	async compress(): Promise<void> {
		const { gzip, zstd, brotli } = this.enabledCompressors

		let runners = []
		if (gzip) runners.push(this.gzip.run(this.files, this.concurrency))
		if (zstd) runners.push(this.zstd.run(this.files, this.concurrency))
		if (brotli) runners.push(this.brotli.run(this.files, this.concurrency))

		await Promise.all(runners)
	}

	public get enabledCompressors(): Record<Format, boolean> {
		return {
			brotli: this.brotli.enabled,
			gzip: this.gzip.enabled,
			zstd: this.zstd.enabled,
		}
	}
}
