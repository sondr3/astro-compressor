<h1 align="center">astro-compressor</h1>
<p align="center">
    <a href="https://github.com/sondr3/astro-compressor/actions"><img alt="GitHub Actions Status" src="https://github.com/sondr3/astro-compressor/workflows/pipeline/badge.svg" /></a>
    <a href="https://www.npmjs.com/package/astro-compressor"><img src="https://img.shields.io/npm/v/astro-compressor" alt="npm version"></a>
</p>

<p align="center">
    <b>A gzip, brotli and zstd compressor for Astro</b>
</p>

- **All the compression**: `brotli`, `zstd`, `gzip`, oh my
- **Simple**: Set it and forget it
- **Configurable**: Allows full configuration for those that require it
- **Performant**: Using worker threads, thousands of static assets are compressed in less than a second
- **Optimal**: By compressing ahead of time, fewer cycles are wasted compressing the same files again and again
- **Hooks**: Allows you to hook into the compression loop for _full_ customizability

<details>
<summary>Table of Contents</summary>
<br />

## Table of Contents

- [Quickstart](#quickstart)
- [NOTE](#NOTE)
- [Usage](#usage)
  - [Configuration](#configuration)
- [License](#license)

</details>

> [!NOTE]
> This only works for static exports, SSR does not export assets that can be compressed ahead of time so you need to solve it with middleware. See [this](https://github.com/sondr3/astro-compressor/issues/13#issuecomment-1739721634) for more context and a partial solution.

# Quickstart

Install via your tool of choice:

```sh
# Using NPM
npx astro add astro-compressor
# Using Yarn
yarn astro add astro-compressor
# Using PNPM
pnpm astro add astro-compressor
```

To compress your files, simply run `pnpm build` and look for the compression messages in the build log.

> [!IMPORTANT]
> It is important that this is the last integration in the `integrations` property to ensure all the generated files are compressed.

# Usage

First, install the package with your favorite package manager: `pnpm add astro-compressor`, then
configure it in your `astro.config.*` file in the `integrations` property:

```ts
import { defineConfig } from "astro/config";
import compressor from "astro-compressor";

export default defineConfig({
  // ...
  integrations: [..., compressor()],
});
```

By default `gzip`, `brotli` and `zstd` are enabled with options for optimal compression
and performance.

## Configuration

### Enabling

You can enable and/or disable the compression algorithms compression by
passing an options object to the compressor:

```ts
import { defineConfig } from "astro/config"
import compressor from "astro-compressor"

export default defineConfig({
	// ...
	integrations: [
		// ...
		compressor({ gzip: true, brotli: false }),
	],
})
```

### Advanced settings

If the default settings are not to your liking you can also configure the various
options for each compressor directly instead, these are merged with the default options
when resoling the full options object. You can also import the defaults and customize
the options further:

```ts
import { defineConfig } from "astro/config"
import compressor, { gzipDefaults } from "astro-compressor"

export default defineConfig({
	// ...
	integrations: [
		// ....
		compressor({
			gzip: { level: 6, ...gzipDefaults },
			brotli: { chunkSize: 16 * 512 },
		}),
	],
})
```

### Hooks (_new in v2_)

For full control over what gets compressed with specific formats and options, you can
also hook into various hooks to control _everything_. Using a TypeScript config is
highly recommended if you want to use these due to the types.

#### `fileFilter`

This hook allows you to override which files are filtered out for further compression
by filtering on things like the directory it's in or its extension and so on. This returns
the full path to each file.

```ts
import { defineConfig } from "astro/config"
import compressor from "astro-compressor"
import path from "node:path"

export default defineConfig({
	// ...
	integrations: [
		// ...,
		compressor({
			hooks: {
				fileFilter: ({ filePath, logger }): boolean => {
					return path.basename(filePath) === "foo.html"
				},
			},
		}),
	],
})
```

By default, this uses the exported `defaultFileFilter` function which uses the `defaultFileExtensions` array
to filter files by their extensions.

#### `preCompression`

Even if you kept a file from the `fileFilter` hook you may not want to compress it with
a certain algorithm. This allows you to filter out files on a per-format basis. By default,
it is undefined and all files are included.

```ts
import { defineConfig } from "astro/config"
import compressor, { type HookResult } from "astro-compressor"

export default defineConfig({
	// ...
	integrations: [
		// ...,
		compressor({
			hooks: {
				preCompression: ({ filePath, format, logger }): HookResult => {
					if (format === "gzip" && filePath.includes("_skip")) {
						return "skip"
					}
				},
			},
		}),
	],
})
```

This can also be used to debug issues with compressing.

#### `fileOptions`

You may want to even override options on a file-by-file basis per format, which this
hooks gives you the option to. By default, it is `undefined` and falls back to either
the default options or your globally set options. The default options are exported as
`gzipDefaults`, `brotliDefaults` and `zstdDefaults` respectively.

Note that this hook is a bit awkward and slow as it'll run once per file per format, so
it should only be used if you need and want full control of compression per file per format.

```ts
import { defineConfig } from "astro/config"
import compressor from "astro-compressor"
import zlib from "node:zlib"

export default defineConfig({
	// ...
	integrations: [
		// ...,
		compressor({
			hooks: {
				fileOptions: {
					gzip: ({ filePath, logger }) => {
						if (filePath.endsWith(".txt")) {
							return { level: zlib.constants.Z_DEFAULT_COMPRESSION }
						}
					},
				},
			},
		}),
	],
})
```

#### `postCompression`

And finally, you can do a final decision on whether to keep a compressed file after it
has been compressed. This can be useful if you want to avoid saving compressed files that
are larger than the input, or only saving files that are compressed above a certain threshold.

By default, it skips files that are compressed larger than the input. The `inputSize` and `outputSize`
parameters are in bytes.

```ts
import { defineConfig } from "astro/config"
import compressor, { type HookResult } from "astro-compressor"

export default defineConfig({
	// ...
	integrations: [
		// ...,
		compressor({
			hooks: {
				postCompression: ({ inputPath, inputSize, outputPath, outputSize, format, logger }): HookResult => {
					if (outputSize >= inputSize) {
						return "skip"
					}
				},
			},
		}),
	],
})
```

# License

MIT.
