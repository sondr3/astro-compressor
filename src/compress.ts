import { createReadStream, createWriteStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { hrtime } from "node:process";
import { promises as stream } from "node:stream";
import { createBrotliCompress, createGzip } from "node:zlib";

import * as logger from "./logger.js";

interface CompressionOptions {
	dir: string;
	extensions: Array<string>;
	enabled?: boolean;
	batchSize?: number;
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

// const compress = async <T>(name: string, compressor: () => T, opts: CompressionOptions): Promise<void> => {};

export const gzip = async (
	dir: string,
	extensions: Array<string>,
	enabled?: boolean,
	batchSize = 10,
): Promise<void> => {
	if (!enabled) {
		logger.warn("gzip compression disabled, skipping...");
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
				const destination = createWriteStream(`${path}.br`);
				const brotli = createGzip({ level: 9 });
				await stream.pipeline(source, brotli, destination);
			}),
		);
	}

	const end = hrtime.bigint();
	logger.success(`finished gzip of ${files.length} files in ${(end - start) / BigInt(1000000)}ms`);
};

export const brotli = async (
	dir: string,
	extensions: Array<string>,
	enabled?: boolean,
	batchSize = 10,
): Promise<void> => {
	if (!enabled) {
		logger.warn("brotli compression disabled, skipping...");
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
				const destination = createWriteStream(`${path}.br`);
				const brotli = createBrotliCompress();
				await stream.pipeline(source, brotli, destination);
			}),
		);
	}

	const end = hrtime.bigint();
	logger.success(`finished brotli of ${files.length} files in ${(end - start) / BigInt(1000000)}ms`);
};
