import config from "@sondr3/oxlint"
import { defineConfig } from "oxlint"

export default defineConfig({
	extends: [config],
	rules: {},
	overrides: [
		{
			files: ["*.config.{ts,mjs}", "index.ts"],
			rules: {
				"import/no-default-export": "off",
			},
		},
		{
			files: ["test/**"],
			rules: {
				"unicorn/filename-case": "off",
				"import/unambiguous": "off",
				"import/no-relative-parent-imports": "off",
				"typescript/triple-slash-reference": "off",
			},
		},
	],
})
