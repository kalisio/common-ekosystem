---
title: env
description: Runtime environment detection utilities.
---

# env

Runtime environment detection utilities. All properties are evaluated once at module load time.

## Properties

| Name | Type | Description |
|------|------|-------------|
| `browser` | `boolean` | `true` when running in a browser main thread (not a Worker) |
| `node` | `boolean` | `true` when running in Node.js |
| `worker` | `boolean` | `true` when running in a dedicated or shared Web Worker |
| `serviceWorker` | `boolean` | `true` when running in a Service Worker |
| `test` | `boolean` | `true` when `NODE_ENV` is `'test'` |
| `dev` | `boolean` | `true` when `NODE_ENV` is `'development'` |
| `prod` | `boolean` | `true` when `NODE_ENV` is `'production'` |

## Notes

- `browser` and `node` are mutually exclusive in standard environments.
- `browser` checks both `window` and `window.document` to exclude Web Workers, which have `self` but no `document`.
- `node` checks `process.versions.node` rather than just `process`, since some bundlers (e.g. Vite) inject a stub `process` object in browser environments.
- At most one of `dev`, `prod`, and `test` should be `true` at a time.

## Examples

```js
import { env } from '@kalisio/common-core'

if (env.browser) {
  // browser-only code
}

if (env.node) {
  // Node-only code
}
```