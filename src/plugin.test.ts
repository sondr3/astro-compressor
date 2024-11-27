import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "vitest";

test("astro build outputs expected log", () => {
	const build = spawnSync("pnpm", ["build"], {
		encoding: "utf8",
		stdio: "pipe",
		cwd: path.join(process.cwd(), "test"),
	});

	expect(build.stdout).toContain("finished gzip of 2 files");
	expect(build.stdout).toContain("finished brotli of 2 files");
	expect(build.stderr).toBeFalsy();
	expect(build.status).toBe(0);
});