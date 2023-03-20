import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { brotli, gzip } from "./compress.js";
import { Logger } from "./logger.js";

const defaultFileExtensions = [".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"];

interface Options {
  /** Enable gzip compression */
  gzip?: boolean;
  /** Enable brotli compression */
  brotli?: boolean;
  /** Extensions to compress, must be in the format `.html`, `.css` etc */
  fileExtensions?: Array<string>;
}

const defaultOptions: Required<Options> = {
  gzip: true,
  brotli: true,
  fileExtensions: defaultFileExtensions,
};

// eslint-disable-next-line import/no-default-export
export default function (opts: Options = defaultOptions): AstroIntegration {
  const options = { ...defaultOptions, ...opts };

  return {
    name: "astro-compressor",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const path = fileURLToPath(dir);
        await Promise.allSettled([
          gzip(path, options.fileExtensions, options.gzip),
          brotli(path, options.fileExtensions, options.brotli),
        ]);
        Logger.success("Compression finished\n");
      },
    },
  };
}
