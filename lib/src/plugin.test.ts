import { spawnSync } from "node:child_process"
import * as console from "node:console"
import fs from "node:fs/promises"
import path from "node:path"

import { expect, test } from "vitest"

test("astro build outputs expected log", () => {
	const cwd = path.join(process.cwd(), "..", "integration-tests", "happy-path")
	const build = spawnSync("pnpm", ["--silent", "build"], {
		encoding: "utf8",
		stdio: "pipe",
		cwd,
		// oxlint-disable-next-line node/no-process-env
		env: { ...process.env, NO_COLOR: "1" },
	})

	expect(build.stdout).toContain("[astro-compressor] using brotli, gzip, zstd")
	expect(build.stdout).toContain("[astro-compressor] gzip     compressed 2 files")
	expect(build.stdout).toContain("[astro-compressor] brotli   compressed 2 files")
	expect(build.stdout).toContain("[astro-compressor] zstd     compressed 2 files")
	expect(build.stdout).toContain("[astro-compressor] finished in")
	expect(build.stderr).toBeFalsy()
	expect(build.status).toBe(0)
})

test("astro build with brotli disabled", () => {
	const cwd = path.join(process.cwd(), "..", "integration-tests", "disabled")
	const build = spawnSync("pnpm", ["--silent", "build"], {
		encoding: "utf8",
		stdio: "pipe",
		cwd,
		// oxlint-disable-next-line node/no-process-env
		env: { ...process.env, NO_COLOR: "1" },
	})

	expect(build.stdout).toContain("[astro-compressor] using gzip, zstd (brotli disabled)")
	expect(build.stdout).toContain("[astro-compressor] gzip     compressed 2 files")
	expect(build.stdout).toContain("[astro-compressor] zstd     compressed 2 files")
	expect(build.stdout).toContain("[astro-compressor] finished in")
	expect(build.stderr).toBeFalsy()
	expect(build.status).toBe(0)
})

test("astro build with pre/post hooks", async () => {
	const cwd = path.join(process.cwd(), "..", "integration-tests", "hooks")
	const build = spawnSync("pnpm", ["--silent", "build"], {
		encoding: "utf8",
		stdio: "pipe",
		cwd,
		// oxlint-disable-next-line node/no-process-env
		env: { ...process.env, NO_COLOR: "1" },
	})

	expect(build.stdout).toContain("[astro-compressor] using brotli, gzip, zstd")
	expect(build.stdout).toContain("[astro-compressor] gzip     compressed 2 files")
	expect(build.stdout).toContain("[astro-compressor] brotli   compressed 3 files")
	expect(build.stdout).toContain("[astro-compressor] zstd     compressed 2 files")
	expect(build.stdout).toContain("[astro-compressor] finished in")
	expect(build.stderr).toBeFalsy()
	expect(build.status).toBe(0)

	const files = await fs.readdir(path.join(cwd, "dist"))
	console.log(files)
	expect(files).not.toContain("sitemap.xml.gz")
	expect(files).not.toContain("sitemap.xml.zst")
	expect(files).toContain("sitemap.xml.br")
})
