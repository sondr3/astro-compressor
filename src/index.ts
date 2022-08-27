import type { AstroIntegration } from "astro";

import { Logger } from "./logger.js";

export const createCompressionPlugin = (): AstroIntegration => {
  return {
    name: "astro-compressor",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        Logger.success("Compression finished\n");
      },
    },
  };
};

// eslint-disable-next-line import/no-default-export
export default createCompressionPlugin;
