import { parentPort } from "node:worker_threads"
import zlib from "node:zlib"

import type { Format, OptionsMap } from "#/compressor.js"

type BaseTask = { file: string; source: ArrayBuffer }
export type Task<N extends Format = Format> = {
	[K in N]: BaseTask & { format: K; options: OptionsMap[K] }
}[N]

export interface CompressionResult {
	file: string
	format: Format
	output: ArrayBuffer
}

const assertNever = (): never => {
	throw new Error()
}

const compress = ({ options, format, source }: Task): Buffer => {
	switch (format) {
		case "gzip":
			return zlib.gzipSync(source, options)
		case "brotli":
			return zlib.brotliCompressSync(source, options)
		case "zstd":
			return zlib.zstdCompressSync(source, options)
		default:
			throw assertNever()
	}
}

parentPort?.on("message", (task: Task) => {
	const res = compress(task)
	const output = new Uint8Array(res).buffer
	parentPort?.postMessage({ file: task.file, format: task.format, output }, [output])
})
