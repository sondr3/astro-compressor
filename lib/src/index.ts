import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import type { BrotliOptions, ZlibOptions, ZstdOptions } from "./compress.js";
import { brotli, gzip, zstd } from "./compress.js";

const defaultFileExtensions = new Set([".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"]);

interface Options {
	/** Enable gzip compression */
	gzip?: boolean | ZlibOptions;
	/** Enable brotli compression */
	brotli?: boolean | BrotliOptions;
	/** Enable zstd compression */
	zstd?: boolean | ZstdOptions;
	/** Extensions to compress, must be in the format `.html`, `.css` etc */
	fileExtensions?: Set<string>;
	/** Number of files to batch process */
	batchSize?: number;
}

const defaultOptions: Required<Options> = {
	gzip: true,
	brotli: true,
	zstd: true,
	fileExtensions: defaultFileExtensions,
	batchSize: 10,
};

// oxlint-disable-next-line unicorn/no-anonymous-default-export, import/no-default-export
export default function (opts: Options = defaultOptions): AstroIntegration {
	const options = { ...defaultOptions, ...opts };

	return {
		name: "astro-compressor",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				const root = fileURLToPath(dir);
				const entries = await fs.readdir(root, { withFileTypes: true, recursive: true });
				const files = entries
					.filter((p) => p.isFile() && options.fileExtensions.has(path.extname(p.name)))
					.map((p) => path.join(p.parentPath, p.name));

				await Promise.allSettled([
					gzip(files, logger, options.gzip, options.batchSize),
					brotli(files, logger, options.brotli, options.batchSize),
					zstd(files, logger, options.zstd, options.batchSize),
				]);
				logger.info("Compression finished\n");
			},
		},
	};
}
