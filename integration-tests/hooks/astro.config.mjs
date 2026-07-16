import compressor from "astro-compressor"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
	integrations: [
		compressor({
			hooks: {
				preCompression: ({ filePath, format }) => {
					if (filePath.endsWith("xml") && format === "zstd") return "skip"
					return "keep"
				},
				postCompression: ({ outputPath, format }) => {
					if (outputPath.includes("sitemap.xml") && format === "gzip") return "skip"
					return "keep"
				},
			},
		}),
	],
})
