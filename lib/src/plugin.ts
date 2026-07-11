import * as zlib from "node:zlib"

import type { Format, Options } from "#/index.js"

export const enabledFormats = (options: Options): Record<Format, boolean> => {
	return {
		gzip: options.gzip !== null && options.gzip !== false,
		brotli: options.brotli !== null && options.brotli !== false,
		zstd: typeof zlib.createZstdCompress === "function" && options.zstd !== null && options.zstd !== false,
	}
}
