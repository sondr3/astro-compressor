import compressor from "astro-compressor";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [compressor({ gzip: true, brotli: { chunkSize: 16 * 1024 } })],
});
