## 1.2.0
> 2025-10-15

## Summary

This release adds support for configuring the compression algorithms directly
instead of just a boolean flag for more advanced usage. It also includes a
optimized file searching by only traversing the output directory once.

### Commits
- [[`eb123a8`](https://github.com/sondr3/astro-compressor/commit/eb123a8)] Bump actions/setup-node from 5 to 6
- [[`aeaa6b0`](https://github.com/sondr3/astro-compressor/commit/aeaa6b0)] Bump pnpm/action-setup from 4.1.0 to 4.2.0
- [[`40c660e`](https://github.com/sondr3/astro-compressor/commit/40c660e)] Bump actions/setup-node from 4 to 5
- [[`0e77401`](https://github.com/sondr3/astro-compressor/commit/0e77401)] Test with bools and objects
- [[`36050b2`](https://github.com/sondr3/astro-compressor/commit/36050b2)] Next prerelease
- [[`405945b`](https://github.com/sondr3/astro-compressor/commit/405945b)] Fix 'enabled' for brotli and zstd
- [[`4696d84`](https://github.com/sondr3/astro-compressor/commit/4696d84)] Update README
- [[`ea30882`](https://github.com/sondr3/astro-compressor/commit/ea30882)] Use my new, actual last name
- [[`d578795`](https://github.com/sondr3/astro-compressor/commit/d578795)] Mark as prerelease
- [[`e95738e`](https://github.com/sondr3/astro-compressor/commit/e95738e)] Only find files once instead of per compressor
- [[`8941c4e`](https://github.com/sondr3/astro-compressor/commit/8941c4e)] Add @tsconfig/node22
- [[`9731ae9`](https://github.com/sondr3/astro-compressor/commit/9731ae9)] Add compression options to compressions
- [[`33c0f46`](https://github.com/sondr3/astro-compressor/commit/33c0f46)] Bump actions/checkout from 4 to 5

## v1.1.2
> 2025-08-06

## Summary

Documentation update to mention `zstd` compression alongside other compression algorithms.

### Commits
- [[`c9d3fd7`](https://github.com/sondr3/astro-compressor/commit/c9d3fd7)] Mention zstd alongside other compression algorithms

## v1.1.1
> 2025-07-30

## Summary

Bug fix for gracefully handling Node versions without zstd compression.

### Commits
- [[`9855701`](https://github.com/sondr3/astro-compressor/commit/9855701)] Gracefully fall back when zstd is not supported
- [[`9fdc219`](https://github.com/sondr3/astro-compressor/commit/9fdc219)] Set the engines to proper versions

## v1.1.0
> 2025-07-28

## Summary

Thanks to @Alex-1701, `astro-compressor` now also supports [`zstd`](https://caniuse.com/?search=zstd) compression.

### Commits
- [[`c3082cc`](https://github.com/sondr3/astro-compressor/commit/c3082cc)] Update README, set 'engines' field in package.json
- [[`f851c2b`](https://github.com/sondr3/astro-compressor/commit/f851c2b)] Add lefthook to approved builds
- [[`b644541`](https://github.com/sondr3/astro-compressor/commit/b644541)] Infer pnpm version from package.json
- [[`31f61a0`](https://github.com/sondr3/astro-compressor/commit/31f61a0)] Upgrade dependencies
- [[`9110521`](https://github.com/sondr3/astro-compressor/commit/9110521)] Add zstd (#19)
- [[`4b1e3c3`](https://github.com/sondr3/astro-compressor/commit/4b1e3c3)] Bump pnpm/action-setup from 4.0.0 to 4.1.0
- [[`a69e499`](https://github.com/sondr3/astro-compressor/commit/a69e499)] Only publish from one CI

## v1.0.0

> 2024-11-28

## Summary

The main change is that the compression is now batch parallelized to speed up
compression for larger sites and the custom logger was replaced with the Astro
logger. Bumped packages and moved from ESLint/Prettier to Biome.

### Commits

- [[`8892cf1`](https://github.com/sondr3/astro-compressor/commit/8892cf1)] Use AstroIntegrationLogger over custom logger
- [[`4853f21`](https://github.com/sondr3/astro-compressor/commit/4853f21)] Update README
- [[`2b9a0ab`](https://github.com/sondr3/astro-compressor/commit/2b9a0ab)] Run CI against latest and LTS NodeJS
- [[`2150125`](https://github.com/sondr3/astro-compressor/commit/2150125)] Extract out compression login to shared function
- [[`e7bc27d`](https://github.com/sondr3/astro-compressor/commit/e7bc27d)] Parallelize and batch process files
- [[`8c56e05`](https://github.com/sondr3/astro-compressor/commit/8c56e05)] And run correct lint tasks in CI
- [[`18cdd9c`](https://github.com/sondr3/astro-compressor/commit/18cdd9c)] Use pnpm@9 in CI
- [[`3d55b57`](https://github.com/sondr3/astro-compressor/commit/3d55b57)] Bump remaining packages
- [[`b2ed13e`](https://github.com/sondr3/astro-compressor/commit/b2ed13e)] Bump typescript, use @tsconfig/bases packages for config
- [[`e28eb3a`](https://github.com/sondr3/astro-compressor/commit/e28eb3a)] Add test step to CI
- [[`ce437bd`](https://github.com/sondr3/astro-compressor/commit/ce437bd)] Add a test site to run integration tests against
- [[`0db2b37`](https://github.com/sondr3/astro-compressor/commit/0db2b37)] Remove prettier and eslint, move to biome
- [[`f125d43`](https://github.com/sondr3/astro-compressor/commit/f125d43)] Bump pnpm/action-setup from 3.0.0 to 4.0.0
- [[`633c1a9`](https://github.com/sondr3/astro-compressor/commit/633c1a9)] Bump pnpm/action-setup from 2.4.0 to 3.0.0
- [[`ec3bff9`](https://github.com/sondr3/astro-compressor/commit/ec3bff9)] Bump actions/setup-node from 3 to 4

## v0.4.1

> 2023-09-29

## Summary

Documentation updates, no functional changes.

### Commits

- [[`7750c7e`](https://github.com/sondr3/astro-compressor)] Add note about SSR not working
- [[`ac15c66`](https://github.com/sondr3/astro-compressor)] Bump actions/checkout from 3 to 4
- [[`7099290`](https://github.com/sondr3/astro-compressor)] Bump pnpm/action-setup from 2.3.0 to 2.4.0
- [[`e554525`](https://github.com/sondr3/astro-compressor)] Bump pnpm/action-setup from 2.2.4 to 2.3.0
- [[`ad26a44`](https://github.com/sondr3/astro-compressor)] Add defaults for fileExtensions to README

## v0.4.0

> 2023-03-20

## Summary

Add configurable file extensions to options, allowing the user to change the default
files that are compressed.

### Commits

- [[`02181b8`](https://github.com/sondr3/astro-compressor)] Add file extension configuration to README
- [[`4015722`](https://github.com/sondr3/astro-compressor)] Make compressed file extensions configurable
- [[`f3355d1`](https://github.com/sondr3/astro-compressor)] Bump dependencies
- [[`53f98e7`](https://github.com/sondr3/astro-compressor)] Bump packages
- [[`102fe95`](https://github.com/sondr3/astro-compressor)] Cache prettier

## v0.3.0

> 2023-01-31

## Summary

Add configuration options to integration, bump Astro dependency to 2.0.

### Commits

- [[`bf612b4`](https://github.com/sondr3/astro-compressor)] Add configuration to README
- [[`230e092`](https://github.com/sondr3/astro-compressor)] Bump packages
- [[`3472d07`](https://github.com/sondr3/astro-compressor)] Allow enabling/disabling gzip and brotli compression
- [[`711a36f`](https://github.com/sondr3/astro-compressor)] Prefix url with `node:`

## v0.2.2

> 2022-12-29

## Summary

Fix paths for Windows.

### Commits

- [[`d9d04eb`](https://github.com/sondr3/astro-compressor)] Use fileUrlToPath to fix path on Windows
- [[`cef27ed`](https://github.com/sondr3/astro-compressor)] Don't force height on badge
- [[`2fbaa34`](https://github.com/sondr3/astro-compressor)] Use shields.io over badge.fury.io
- [[`a0f7ba1`](https://github.com/sondr3/astro-compressor)] Update version badge

## v0.2.1

> 2022-12-29

## Summary

Spelling fix and file name filtering change.

### Commits

- [[`fc44e2a`](https://github.com/sondr3/astro-compressor)] Use extname to get file extension
- [[`341fd5c`](https://github.com/sondr3/astro-compressor)] Change m -> ms

## v0.2.0

> 2022-12-29

## Summary

Removal of dependency over using the node standard library.

### Commits

- [[`f0840e5`](https://github.com/sondr3/astro-compressor)] Remove globby dependency, use stdlib

## v0.1.3

> 2022-12-27

## Summary

Update dependencies, fix some CI steps.

### Commits

- [[`28b0d90`](https://github.com/sondr3/astro-compressor)] Fix release CI step
- [[`acc0b18`](https://github.com/sondr3/astro-compressor)] Update dependencies, fix formatting
- [[`8a64bff`](https://github.com/sondr3/astro-compressor)] Add publish step on CI pipeline

## v0.1.2

> 2022-08-28

## Summary

Fix wording in README.

### Commits

- [[`983215e`](https://github.com/sondr3/astro-compressor)] Update README

## v0.1.1

> 2022-08-27

## Summary

Quick bugfix release for a stray `console.log` that was left accidentally.

### Commits

- [[`375745f`](https://github.com/sondr3/astro-compressor)] Release v0.1.1

## v0.1.0

> 2022-08-27

## Summary

Initial relase of a gzip and brotli compressor for Astro.

### Commits

- [[`0067f9c`](https://github.com/sondr3/astro-compressor)] Fix compression
- [[`5b821f3`](https://github.com/sondr3/astro-compressor)] Add compression logic
- [[`bfd7439`](https://github.com/sondr3/astro-compressor)] In the beginning there was darkness
