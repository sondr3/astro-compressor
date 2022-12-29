import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { brotli, gzip } from "./compress.js";
import { Logger } from "./logger.js";

export const createCompressionPlugin = (): AstroIntegration => {
  return {
    name: "astro-compressor",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const path = fileURLToPath(dir);
        await Promise.allSettled([gzip(path), brotli(path)]);
        Logger.success("Compression finished\n");
      },
    },
  };
};

// eslint-disable-next-line import/no-default-export
export default createCompressionPlugin;
