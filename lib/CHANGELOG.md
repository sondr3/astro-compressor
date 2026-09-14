## v2.0.1

> 2026-09-14

## Summary

A complete, but backwards compatible rewrite of the internals of the library. The internal
workflow has gone from a `Promise`-based main loop to a worker pool based main loop to offload
compression to worker threads. This has yielded a ~2x performance increase. A hook-based system
has also been added to give more flexibility and customizability should you need to hook into
per-file, per-format options or ignoring files per format.

## Performance

The underlying machinery for compressing was changed from a `Promise`-based per-format x file
main loop to a worker thread pool that offloads the compression from the main thread to workers
while keeping IO on the main thread. The primary reason for this is that even with `Promise.all`
the compressors are limited by the libuv threadpool size so you don't get unlimited concurreny.

Based on the default `pnpm create astro@latest` setup with a `[n].astro` page generated
a set amount of times, on my M1 Max machine the performance benchmark looks like this:

| #num pages |     v1 |     v2 |     diff | speedup |
| ---------: | -----: | -----: | -------: | ------: |
|        100 |  553ms |  253ms |   -300ms |   2.19x |
|       1000 |  5.33s |  2.31s |  -3.02ds |   2.31x |
|       5000 | 25.77s | 11.00s | -14.77ds |   2.34x |
|      10000 | 51.46s | 22.03s | -29.43ds |   2.34x |

### What happened to 2.0.0?

I didn't realize `npm` does not publish symlinked files and thus the release had no
README when published... :facepalm:

### Commits

- [[`1ea4829`](https://github.com/sondr3/astro-compressor/commit/1ea4829)] Add note about 2.0.1
- [[`ed94c95`](https://github.com/sondr3/astro-compressor/commit/ed94c95)] Move README to lib, symlink in other direction
- [[`494ccd1`](https://github.com/sondr3/astro-compressor/commit/494ccd1)] Bump dependencies
- [[`45e06b2`](https://github.com/sondr3/astro-compressor/commit/45e06b2)] Bump to v2.0.0-rc.1
- [[`3d37c9e`](https://github.com/sondr3/astro-compressor/commit/3d37c9e)] Mention that 'inputSize' and 'outputSize' are in bytes
- [[`f187610`](https://github.com/sondr3/astro-compressor/commit/f187610)] Use a resolved 'filePath: string' instead of Dirent in 'fileFilter'
- [[`d839062`](https://github.com/sondr3/astro-compressor/commit/d839062)] Add missing exports, update README slightly
- [[`acce808`](https://github.com/sondr3/astro-compressor/commit/acce808)] 'exports' field to handle exports properly
- [[`06ad506`](https://github.com/sondr3/astro-compressor/commit/06ad506)] Bump to v2.0.0-rc.0
- [[`3e0af97`](https://github.com/sondr3/astro-compressor/commit/3e0af97)] Use TS config in happy path tests to catch stuff like this
- [[`462ea50`](https://github.com/sondr3/astro-compressor/commit/462ea50)] Whoops, allow user to pass no options again
- [[`13e299f`](https://github.com/sondr3/astro-compressor/commit/13e299f)] Add some notes to the changelog
- [[`cb2bf08`](https://github.com/sondr3/astro-compressor/commit/cb2bf08)] Re-enable only running CI against main or PRs
- [[`74fdd35`](https://github.com/sondr3/astro-compressor/commit/74fdd35)] Fix fileOptions hook example
- [[`31b2640`](https://github.com/sondr3/astro-compressor/commit/31b2640)] Bump to v2-beta
- [[`feaab39`](https://github.com/sondr3/astro-compressor/commit/feaab39)] Whoops, forgot to type check
- [[`e29efbe`](https://github.com/sondr3/astro-compressor/commit/e29efbe)] Refactor fileOptions hook due to types being useless
- [[`19dcf94`](https://github.com/sondr3/astro-compressor/commit/19dcf94)] Update README and documentation
- [[`62ba83b`](https://github.com/sondr3/astro-compressor/commit/62ba83b)] Move types around, rename and de-generify
- [[`ece9588`](https://github.com/sondr3/astro-compressor/commit/ece9588)] Rename and refactor hooks
- [[`00ea934`](https://github.com/sondr3/astro-compressor/commit/00ea934)] Continue, not return, whoops
- [[`6682808`](https://github.com/sondr3/astro-compressor/commit/6682808)] Run all compressors per file instead of compressor x file
- [[`5dba758`](https://github.com/sondr3/astro-compressor/commit/5dba758)] 'Order' compressors so tests still pass
- [[`d67dc52`](https://github.com/sondr3/astro-compressor/commit/d67dc52)] Rework queueTask to a queue class, add back compressed counter
- [[`62fe746`](https://github.com/sondr3/astro-compressor/commit/62fe746)] Correct log output for hook shimming, early return if all compressors disabled
- [[`782bbb8`](https://github.com/sondr3/astro-compressor/commit/782bbb8)] Fix some crashes in WorkerPool
- [[`49bbae7`](https://github.com/sondr3/astro-compressor/commit/49bbae7)] Experiment with worker threads for actual parallelism
- [[`0925980`](https://github.com/sondr3/astro-compressor/commit/0925980)] Skip files with compressed extensions outright when finding files
- [[`272a424`](https://github.com/sondr3/astro-compressor/commit/272a424)] Run tests only on source files, up timeout
- [[`4c8a78f`](https://github.com/sondr3/astro-compressor/commit/4c8a78f)] Create a bunch more integration tests
- [[`7906c3d`](https://github.com/sondr3/astro-compressor/commit/7906c3d)] Fix conditional access of deprecated options
- [[`919ba42`](https://github.com/sondr3/astro-compressor/commit/919ba42)] Merge hook result type into one
- [[`af8d248`](https://github.com/sondr3/astro-compressor/commit/af8d248)] Better handling of post compression hook
- [[`35ad8ab`](https://github.com/sondr3/astro-compressor/commit/35ad8ab)] Always throw in try/catch in main code
- [[`b9114f6`](https://github.com/sondr3/astro-compressor/commit/b9114f6)] Fix stray ' b' sneaking in file sizes
- [[`364b1cb`](https://github.com/sondr3/astro-compressor/commit/364b1cb)] Handle pre compression hook with old 'fileExtensions'
- [[`81089ce`](https://github.com/sondr3/astro-compressor/commit/81089ce)] Deep merge hooks in plugin init too
- [[`fffd528`](https://github.com/sondr3/astro-compressor/commit/fffd528)] Filter out everything besides files, whoops
- [[`b593b61`](https://github.com/sondr3/astro-compressor/commit/b593b61)] Set node version to v24
- [[`40a97e3`](https://github.com/sondr3/astro-compressor/commit/40a97e3)] Initiate compressor when running to avoid zstd crashing on Node v22
- [[`8985a29`](https://github.com/sondr3/astro-compressor/commit/8985a29)] Add back deprecated options with logging warnings
- [[`5320a58`](https://github.com/sondr3/astro-compressor/commit/5320a58)] Add astro check to test build
- [[`b5f7771`](https://github.com/sondr3/astro-compressor/commit/b5f7771)] Deep merge compressor options at construction
- [[`ccae937`](https://github.com/sondr3/astro-compressor/commit/ccae937)] Swap back to per-compressor worker loops, slightly faster
- [[`ffe5825`](https://github.com/sondr3/astro-compressor/commit/ffe5825)] Add logging for compressed files
- [[`6de46cb`](https://github.com/sondr3/astro-compressor/commit/6de46cb)] Drop unused batchSize, old compress functions
- [[`96445de`](https://github.com/sondr3/astro-compressor/commit/96445de)] Use a worker pool instead of batch sizes and such
- [[`ed7d76c`](https://github.com/sondr3/astro-compressor/commit/ed7d76c)] Use worker to gather files, wrap in try/catch to avoid swallowing errors
- [[`505cfe7`](https://github.com/sondr3/astro-compressor/commit/505cfe7)] Eh, just log everything in the worker constructor
- [[`7f62d0b`](https://github.com/sondr3/astro-compressor/commit/7f62d0b)] Disable lint for overridden methods not using 'this'
- [[`7d89972`](https://github.com/sondr3/astro-compressor/commit/7d89972)] Split things out into classes
- [[`add3526`](https://github.com/sondr3/astro-compressor/commit/add3526)] Handle enabled formats better, log them
- [[`a405a8e`](https://github.com/sondr3/astro-compressor/commit/a405a8e)] Fix #/foo imports
- [[`5d3a1fe`](https://github.com/sondr3/astro-compressor/commit/5d3a1fe)] Minor beauty fix
- [[`28d4344`](https://github.com/sondr3/astro-compressor/commit/28d4344)] Change hook return types, implement post hook
- [[`cb2cd7f`](https://github.com/sondr3/astro-compressor/commit/cb2cd7f)] Initial WIP of hooks instead of extension based input filtering
- [[`bff8ef3`](https://github.com/sondr3/astro-compressor/commit/bff8ef3)] Build package with dev for better feedback loop
- [[`a31a466`](https://github.com/sondr3/astro-compressor/commit/a31a466)] Enable optional chaining
- [[`992179d`](https://github.com/sondr3/astro-compressor/commit/992179d)] Fix output changing in pnpm v1 in the tests
- [[`c76551d`](https://github.com/sondr3/astro-compressor/commit/c76551d)] Run CI on all push for now
- [[`82595e4`](https://github.com/sondr3/astro-compressor/commit/82595e4)] Upgrade to pnpm v11
- [[`aa79713`](https://github.com/sondr3/astro-compressor/commit/aa79713)] Lock down CI actions
- [[`a3693b5`](https://github.com/sondr3/astro-compressor/commit/a3693b5)] Use my personal oxfmt/oxlint configs
- [[`f9b6f6a`](https://github.com/sondr3/astro-compressor/commit/f9b6f6a)] Use fs.readdir directly instead of walkdir generator
- [[`e9bc6d3`](https://github.com/sondr3/astro-compressor/commit/e9bc6d3)] Upgrade dependencies, refactor TS setup for v7
- [[`56efc6c`](https://github.com/sondr3/astro-compressor/commit/56efc6c)] Bump pnpm/action-setup from 6.0.10 to 6.1.0
- [[`90fe7ea`](https://github.com/sondr3/astro-compressor/commit/90fe7ea)] Bump pnpm/action-setup from 6.0.9 to 6.0.10
- [[`8c02d43`](https://github.com/sondr3/astro-compressor/commit/8c02d43)] Bump actions/setup-node from 6 to 7
- [[`75f7c30`](https://github.com/sondr3/astro-compressor/commit/75f7c30)] Bump actions/checkout from 6 to 7
- [[`c7e7289`](https://github.com/sondr3/astro-compressor/commit/c7e7289)] Bump pnpm/action-setup from 6.0.8 to 6.0.9
- [[`55d1ae6`](https://github.com/sondr3/astro-compressor/commit/55d1ae6)] Bump pnpm/action-setup from 6.0.7 to 6.0.8
- [[`b9d01e3`](https://github.com/sondr3/astro-compressor/commit/b9d01e3)] Bump pnpm/action-setup from 6.0.5 to 6.0.7
- [[`e66ea4c`](https://github.com/sondr3/astro-compressor/commit/e66ea4c)] Bump pnpm/action-setup from 6.0.4 to 6.0.5
- [[`c12602a`](https://github.com/sondr3/astro-compressor/commit/c12602a)] Bump pnpm/action-setup from 6.0.3 to 6.0.4
- [[`1f77ca3`](https://github.com/sondr3/astro-compressor/commit/1f77ca3)] Move CHANGELOG, link README to lib
- [[`9e22030`](https://github.com/sondr3/astro-compressor/commit/9e22030)] Move everything to a monorepo to fix install issues
- [[`49e4172`](https://github.com/sondr3/astro-compressor/commit/49e4172)] Bump pnpm to 10.33, fix approve builds error
- [[`80543d4`](https://github.com/sondr3/astro-compressor/commit/80543d4)] Bump pnpm/action-setup from 5.0.0 to 6.0.3
- [[`ec4fe52`](https://github.com/sondr3/astro-compressor/commit/ec4fe52)] Upgrade packages
- [[`ced43e2`](https://github.com/sondr3/astro-compressor/commit/ced43e2)] Bump pnpm/action-setup from 4.4.0 to 5.0.0
- [[`5581383`](https://github.com/sondr3/astro-compressor/commit/5581383)] Bump pnpm/action-setup from 4.3.0 to 4.4.0
- [[`0fd3c65`](https://github.com/sondr3/astro-compressor/commit/0fd3c65)] Bump pnpm/action-setup from 4.2.0 to 4.3.0

## v1.3.0

> 2026-03-04

## Summary

This release adds better default compression for zstd and brotli, and better
handling of compression options. Thanks to @Daniel15 for this contribution.

### Commits

- [[`9d97f8a`](https://github.com/sondr3/astro-compressor/commit/9d97f8a)] Use a separate release pipeline
- [[`09f173b`](https://github.com/sondr3/astro-compressor/commit/09f173b)] Run 'pnpm fix' in pre-commit hook
- [[`34e8ca2`](https://github.com/sondr3/astro-compressor/commit/34e8ca2)] Drop @tsconfig packages
- [[`d48d4a9`](https://github.com/sondr3/astro-compressor/commit/d48d4a9)] Force NO_COLOR in tests to avoid ANSI shenanigans
- [[`f0816b8`](https://github.com/sondr3/astro-compressor/commit/f0816b8)] Refactor the build setup slightly
- [[`ff616ca`](https://github.com/sondr3/astro-compressor/commit/ff616ca)] Move to oxlint and oxfmt
- [[`98cc08f`](https://github.com/sondr3/astro-compressor/commit/98cc08f)] Bump all packages, fix type errors
- [[`de315e0`](https://github.com/sondr3/astro-compressor/commit/de315e0)] Improve handling of default options @Daniel15
- [[`9878779`](https://github.com/sondr3/astro-compressor/commit/9878779)] Set default compression levels for Brotli and zstd @Daniel15
- [[`f3cf8dc`](https://github.com/sondr3/astro-compressor/commit/f3cf8dc)] Bump actions/checkout from 5 to 6
- [[`3330a3c`](https://github.com/sondr3/astro-compressor/commit/3330a3c)] We now use trusted publishing, remove tokens

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
