import { promises as fs } from "node:fs"

import type { AstroIntegrationLogger } from "astro"

import type { TaskResponse } from "#/compression-worker.js"
import type { Compressor } from "#/compressor.js"
import type { Format, Options } from "#/index.js"
import type { WorkerPool } from "#/worker-pool.js"

export class Queue {
	protected logger: AstroIntegrationLogger
	protected readonly pool: WorkerPool<TaskResponse>
	protected readonly hooks?: Options["hooks"]
	protected readonly compressors: Array<Compressor<Format>>

	counter: Record<Format, number> = { brotli: 0, gzip: 0, zstd: 0 }

	constructor(
		pool: WorkerPool<TaskResponse>,
		compressors: Array<Compressor<Format>>,
		logger: AstroIntegrationLogger,
		hooks: Options["hooks"],
	) {
		this.pool = pool
		this.compressors = compressors
		this.logger = logger
		this.hooks = hooks
	}

	async processFile(file: string): Promise<void> {
		const runners: Array<Compressor<Format>> = []
		const hook = this.hooks?.["compressor:file:before"]
		for (const compressor of this.compressors) {
			if (typeof hook === "function") {
				// oxlint-disable-next-line no-await-in-loop
				const shouldCompress = await hook({ filePath: file, logger: this.logger, format: compressor.name })
				if (shouldCompress === "skip") return
			}

			this.counter[compressor.name] += 1
			runners.push(compressor)
		}

		if (runners.length === 0) return
		const source = await fs.readFile(file)
		const inputSize = source.byteLength

		await Promise.all(
			runners.map(async (compressor, i) => {
				const buf = i === runners.length - 1 ? source.buffer : source.buffer.slice(0)
				const res = await this.pool.execute(compressor.task(file, buf))

				const shouldRemove =
					typeof this.hooks?.["compressor:file:after"] === "function"
						? await this.hooks?.["compressor:file:after"]({
								inputPath: file,
								inputSize,
								outputPath: `${file}.${compressor.ext}`,
								outputSize: res.output.byteLength,
								format: compressor.name,
								logger: this.logger,
							})
						: "keep"

				if (shouldRemove === "keep") {
					await fs.writeFile(`${file}.${compressor.ext}`, Buffer.from(res.output))
				} else {
					this.counter[compressor.name] -= 1
				}
			}),
		)
	}
}
