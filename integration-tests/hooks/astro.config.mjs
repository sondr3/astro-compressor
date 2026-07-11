import compressor from "astro-compressor"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
	integrations: [
		compressor({
			hooks: {
				"compressor:file:before": ({ filePath, format }) => {
					if (filePath.endsWith("xml") && format === "zstd") return "skip"
					return "keep"
				},
				"compressor:file:after": ({ outputPath, format }) => {
					if (outputPath.includes("sitemap.xml") && format === "gzip") return "skip"
					return "keep"
				},
			},
		}),
	],
})
