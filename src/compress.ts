import { createReadStream, createWriteStream } from "node:fs";
import { hrtime } from "node:process";
import { promises as stream } from "node:stream";
import { createBrotliCompress, createGzip } from "node:zlib";

import { globby } from "globby";

import { Logger } from "./logger.js";

const filterFile = (file: string): boolean => {
  return [".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"].some((ext) =>
    file.endsWith(ext),
  );
};

export const gzip = async (dir: URL): Promise<void> => {
  const start = hrtime.bigint();

  const files = (await globby(`${dir.pathname}/**/*`)).filter(filterFile);
  for (const file of files) {
    const source = createReadStream(file);
    const destination = createWriteStream(`${file}.gz`);
    const gzip = createGzip({ level: 9 });
    await stream.pipeline(source, gzip, destination);
  }

  const end = hrtime.bigint();
  Logger.success(`finished gzip of ${files.length} files in ${(end - start) / 1000000n}m`);
};

export const brotli = async (dir: URL): Promise<void> => {
  const start = hrtime.bigint();

  const files = (await globby(`${dir.pathname}/**/*`)).filter(filterFile);
  for (const file of files) {
    const source = createReadStream(file);
    const destination = createWriteStream(`${file}.br`);
    const brotli = createBrotliCompress();
    await stream.pipeline(source, brotli, destination);
  }

  const end = hrtime.bigint();
  Logger.success(`finished brotli of ${files.length} files in ${(end - start) / 1000000n}m`);
};
