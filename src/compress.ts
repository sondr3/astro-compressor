import { createReadStream, createWriteStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { hrtime } from "node:process";
import { promises as stream } from "node:stream";
import { createBrotliCompress, createGzip } from "node:zlib";

import { Logger } from "./logger.js";

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
  return extensions.some((ext) => extname(file) == ext);
};

export const gzip = async (
  dir: string,
  extensions: Array<string>,
  enabled?: boolean,
): Promise<void> => {
  if (!enabled) {
    Logger.warn("gzip compression disabled, skipping...");
    return;
  }

  const start = hrtime.bigint();

  let counter = 0;
  for await (const file of walkDir(dir, extensions)) {
    counter += 1;
    const source = createReadStream(file);
    const destination = createWriteStream(`${file}.gz`);
    const gzip = createGzip({ level: 9 });
    await stream.pipeline(source, gzip, destination);
  }

  const end = hrtime.bigint();
  Logger.success(`finished gzip of ${counter} files in ${(end - start) / 1000000n}ms`);
};

export const brotli = async (
  dir: string,
  extensions: Array<string>,
  enabled?: boolean,
): Promise<void> => {
  if (!enabled) {
    Logger.warn("brotli compression disabled, skipping...");
    return;
  }

  const start = hrtime.bigint();

  let counter = 0;
  for await (const file of walkDir(dir, extensions)) {
    counter += 1;
    const source = createReadStream(file);
    const destination = createWriteStream(`${file}.br`);
    const brotli = createBrotliCompress();
    await stream.pipeline(source, brotli, destination);
  }

  const end = hrtime.bigint();
  Logger.success(`finished brotli of ${counter} files in ${(end - start) / 1000000n}ms`);
};
