<h1 align="center">astro-compressor</h1>
<p align="center">
    <a href="https://github.com/sondr3/astro-compressor/actions"><img alt="GitHub Actions Status" src="https://github.com/sondr3/astro-compressor/workflows/pipeline/badge.svg" /></a>
    <a href="https://www.npmjs.com/package/astro-compressor"><img src="https://img.shields.io/npm/v/astro-compressor" alt="npm version"></a>
</p>

<p align="center">
    <b>A gzip, brotli and zstd compressor for Astro</b>
</p>

- **Simple**: Set it and forget it
- **Optimal**: By compressing ahead of time, a more performant compression can be performed
- **Configurable**: Allows full configuration for those that require it
- **All the compression**: `brotli`, `zstd`, `gzip`, oh my

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

First, install the package with your favorite package manager: `pnpm add --dev astro-compressor`,
then configure it in your `astro.config.*` file in the `integrations` property:

```js
import { defineConfig } from "astro/config";
import compressor from "astro-compressor";

export default defineConfig({
  // ...
  integrations: [..., compressor()],
});
```

## Configuration

### Enabling

You can also optionally enable and/or disable either the gzip or brotli compression by
passing an options object to the compressor:

```js
import { defineConfig } from "astro/config";
import compressor from "astro-compressor";

export default defineConfig({
  // ...
  integrations: [..., compressor({ gzip: true, brotli: false })],
});
```

### Advanced settings

If the default settings are not to your liking you can also configure the various
options for each compressor directly instead:

```js
import { defineConfig } from "astro/config";
import compressor from "astro-compressor";

export default defineConfig({
  // ...
  integrations: [..., compressor({ gzip: { level: 6 }, brotli: { chunkSize: 16 * 512 } })],
});
```

### File handling

Or customize the file formats that will be compressed:

```js
import { defineConfig } from "astro/config";
import compressor from "astro-compressor";

export default defineConfig({
  // ...
  integrations: [..., compressor({
    fileExtensions: [".html"] // only compress HTML files
  })],
});
```

By default, the `fileExtensions` array is `[".css", ".js", ".html", ".xml", ".cjs", ".mjs", ".svg", ".txt"]`.

# License

MIT.
