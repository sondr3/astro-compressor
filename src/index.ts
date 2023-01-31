import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { brotli, gzip } from "./compress.js";
import { Logger } from "./logger.js";

interface Options {
  gzip?: boolean;
  brotli?: boolean;
}

const defaultOptions: Options = {
  gzip: true,
  brotli: true,
};

// eslint-disable-next-line import/no-default-export
export default function (opts: Options = defaultOptions): AstroIntegration {
  const options = { ...defaultOptions, ...opts };

  return {
    name: "astro-compressor",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const path = fileURLToPath(dir);
        await Promise.allSettled([gzip(path, options.gzip), brotli(path, options.brotli)]);
        Logger.success("Compression finished\n");
      },
    },
  };
}
