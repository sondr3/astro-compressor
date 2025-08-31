import { createReadStream, createWriteStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { hrtime } from "node:process";
import { promises as stream } from "node:stream";
import type { BrotliOptions, ZlibOptions, ZstdOptions } from "node:zlib";
import * as zlib from "node:zlib";

import type { AstroIntegrationLogger } from "astro";

export type { BrotliOptions, ZlibOptions, ZstdOptions };

interface CompressionOptions {
	files: Array<string>;
	batchSize: number;
	enabled: boolean | undefined;
	options?: ZlibOptions | BrotliOptions | ZstdOptions | undefined;
}

export async function* walkDir(dir: string, extensions: Array<string>): AsyncGenerator<string> {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const name = resolve(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkDir(name, extensions);
		} else if (filterFile(entry.name, extensions)) {
			yield name;
		}
	}
}

const filterFile = (file: string, extensions: Array<string>): boolean => {
	return extensions.some((ext) => extname(file) === ext);
};

const compress = async <T extends NodeJS.WritableStream>(
	name: string,
	compressedFileNames: string,
	compressor: (options: ZlibOptions | BrotliOptions | ZstdOptions | undefined) => T,
	logger: AstroIntegrationLogger,
	{ files, batchSize, enabled, options }: CompressionOptions,
): Promise<void> => {
	if (!enabled) {
		logger.warn(`${name} compression disabled, skipping...`);
		return;
	}

	const start = hrtime.bigint();
	for (let i = 0; i < files.length; i += batchSize) {
		const batch = files.slice(i, i + batchSize);
		await Promise.all(
			batch.map(async (path) => {
				const source = createReadStream(path);
				const destination = createWriteStream(`${path}.${compressedFileNames}`);
				const comp = compressor(options);
				await stream.pipeline(source, comp, destination);
			}),
		);
	}

	const end = hrtime.bigint();
	logger.info(`${name.padEnd(8, " ")} compressed ${files.length} files in ${(end - start) / BigInt(1000000)}ms`);
};

export const gzip = async (
	files: Array<string>,
	logger: AstroIntegrationLogger,
	enabled?: boolean | ZlibOptions,
	batchSize = 10,
): Promise<void> => {
	await compress("gzip", "gz", zlib.createGzip, logger, {
		files,
		enabled: enabled === true || typeof enabled === "object",
		options: typeof enabled === "object" ? enabled : { level: zlib.constants.Z_BEST_COMPRESSION },
		batchSize,
	});
};

export const brotli = async (
	files: Array<string>,
	logger: AstroIntegrationLogger,
	enabled?: boolean | BrotliOptions,
	batchSize = 10,
): Promise<void> => {
	await compress("brotli", "br", zlib.createBrotliCompress, logger, {
		files,
		enabled: enabled === true || typeof enabled === "object",
		options: typeof enabled === "object" ? enabled : undefined,
		batchSize,
	});
};

export const zstd = async (
	files: Array<string>,
	logger: AstroIntegrationLogger,
	enabled?: boolean | ZstdOptions,
	batchSize = 10,
): Promise<void> => {
	if (typeof zlib.createZstdCompress !== "function") {
		logger.warn("zstd compression is not supported in this Node.js version.");
		return;
	}

	await compress("zstd", "zst", zlib.createZstdCompress, logger, {
		files,
		enabled: enabled === true || typeof enabled === "object",
		options: typeof enabled === "object" ? enabled : undefined,
		batchSize,
	});
};
