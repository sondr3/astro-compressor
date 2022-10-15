<h1 align="center">astro-compressor</h1>
<p align="center">
    <a href="https://github.com/sondr3/astro-compressor/actions"><img alt="GitHub Actions Status" src="https://github.com/sondr3/astro-compressor/workflows/pipeline/badge.svg" /></a>
    <a href="https://www.npmjs.com/package/astro-compressor"><img alt="NPM" src="https://badge.fury.io/js/astro-compressor.svg" /></a>
</p>

<p align="center">
    <b>A gzip and brotli compressor for Astro</b>
</p>

- **Simple**: Set it and forget it
- **Optimal**: By compressing ahead of time, a more performant compression can be performed

<details>
<summary>Table of Contents</summary>
<br />

## Table of Contents

- [Quickstart](#quickstart)
- [NOTE](#NOTE)
- [Usage](#usage)
- [License](#license)
</details>

# NOTE

**Important:** It is vital that this is the last integration in the `integrations`
property. Otherwise some files might not get compressed.

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

Then, restart the dev server by typing `CTRL-C` and then `npm run dev` in the terminal window that was running Astro.

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

# License

MIT.
