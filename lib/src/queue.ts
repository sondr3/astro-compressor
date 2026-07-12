import { promises as fs } from "node:fs"

import type { AstroIntegrationLogger } from "astro"

import type { TaskResponse } from "#/compression-worker.js"
import type { Compressor, OptionsMap } from "#/compressor.js"
import type { Format, Options } from "#/index.js"
import type { WorkerPool } from "#/worker-pool.js"

export class Queue {
	protected logger: AstroIntegrationLogger
	protected readonly pool: WorkerPool<TaskResponse>
	protected readonly hooks?: Options["hooks"]

	counter: Record<Format, number> = { brotli: 0, gzip: 0, zstd: 0 }

	constructor(pool: WorkerPool<TaskResponse>, logger: AstroIntegrationLogger, hooks: Options["hooks"]) {
		this.pool = pool
		this.logger = logger
		this.hooks = hooks
	}

	async processFile<N extends Format>(file: string, compressor: Compressor<N>, options: OptionsMap[N]): Promise<void> {
		if (typeof this.hooks?.["compressor:file:before"] === "function") {
			const shouldCompress = await this.hooks?.["compressor:file:before"]({
				filePath: file,
				logger: this.logger,
				format: compressor.name,
			})
			if (shouldCompress === "skip") return
		}

		this.counter[compressor.name] += 1
		const source = await fs.readFile(file)
		const inputSize = source.byteLength
		const res = await this.pool.execute({
			file: file,
			source: source.buffer,
			options: options,
			format: compressor.name,
		})

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
	}
}
