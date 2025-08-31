import { defineConfig } from "astro/config";
import compressor from "astro-compressor";

// https://astro.build/config
export default defineConfig({
	integrations: [compressor({ gzip: true, brotli: { chunkSize: 16 * 1024 } })],
});
