import { createReadStream, createWriteStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { hrtime } from "node:process";
import { promises as stream } from "node:stream";
import { createBrotliCompress, createGzip, createZstdCompress } from "node:zlib";

import type { AstroIntegrationLogger } from "astro";

interface CompressionOptions {
	dir: string;
	extensions: Array<string>;
	batchSize: number;
	enabled: boolean | undefined;
}

async function* walkDir(dir: string, extensions: Array<string>): AsyncGenerator<string> {
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
	compressor: () => T,
	logger: AstroIntegrationLogger,
	{ dir, extensions, batchSize, enabled }: CompressionOptions,
): Promise<void> => {
	if (!enabled) {
		logger.warn(`${name} compression disabled, skipping...`);
		return;
	}

	const start = hrtime.bigint();
	const files = [];
	for await (const file of walkDir(dir, extensions)) {
		files.push(file);
	}

	for (let i = 0; i < files.length; i += batchSize) {
		const batch = files.slice(i, i + batchSize);
		await Promise.all(
			batch.map(async (path) => {
				const source = createReadStream(path);
				const destination = createWriteStream(`${path}.${compressedFileNames}`);
				const comp = compressor();
				await stream.pipeline(source, comp, destination);
			}),
		);
	}

	const end = hrtime.bigint();
	logger.info(`${name.padEnd(8, " ")} compressed ${files.length} files in ${(end - start) / BigInt(1000000)}ms`);
};

export const gzip = async (
	dir: string,
	logger: AstroIntegrationLogger,
	extensions: Array<string>,
	enabled?: boolean,
	batchSize = 10,
): Promise<void> => {
	await compress("gzip", "gz", createGzip.bind({ level: 9 }), logger, { dir, extensions, enabled, batchSize });
};

export const brotli = async (
	dir: string,
	logger: AstroIntegrationLogger,
	extensions: Array<string>,
	enabled?: boolean,
	batchSize = 10,
): Promise<void> => {
	await compress("brotli", "br", createBrotliCompress, logger, { dir, extensions, enabled, batchSize });
};

export const zstd = async (
	dir: string,
	logger: AstroIntegrationLogger,
	extensions: Array<string>,
	enabled?: boolean,
	batchSize = 10,
): Promise<void> => {
	await compress("zstd", "zst", createZstdCompress, logger, { dir, extensions, enabled, batchSize });
};
