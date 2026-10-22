---
title: logger
description: Dependency-free logging facade with hierarchical categories and application-provided implementations.
---

# logger

## Description

Provides a shared logging facade without depending on a particular logging library. Each component requests a named category, and the application can provide a factory that resolves categories to logger implementations (for example, LogTape or loglevel).

Implementations are resolved lazily and cached by category. Existing facades use new implementations after `setLogger()` is called. The default implementation is `console`; logging failures never interrupt the caller.

## Functions

### getLogger

Creates a facade for a category.

#### Signature

```js
getLogger(category = [])
```

#### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `category` | String or Array | `[]` | Category path, such as `['common-core', 'event-bus']` |

#### Returns

| Member | Signature | Description |
|---|---|---|
| `debug` | `debug(...args)` | Forwards a debug message |
| `info` | `info(...args)` | Forwards an informational message |
| `warn` | `warn(...args)` | Forwards a warning |
| `error` | `error(...args)` | Forwards an error |
| `getChild` | `getChild(child)` | Creates a facade with an extended category path |

A missing logging method is ignored. The implementation is not resolved until the first log call. Each logging method preserves the underlying logger's `this` context.

### setLogger

Configures the factory used by all facades.

#### Signature

```js
setLogger(factory)
```

#### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `factory` | Function | `() => console` | Receives a copy of the category array and returns a logger |

Calling `setLogger()` or `setLogger(null)` resets logging to `console`. A new configuration clears the cache, including for facades created earlier. If the factory throws or returns `null` or `undefined`, resolution falls back to `console`.

#### Throws

An invalid non-null factory throws `TypeError: setLogger expects a factory: (category) => logger`. The existing configuration is preserved.

## Examples

### Default logger and child categories

```js
import { getLogger } from '@kalisio/common-core/runtime'

const logger = getLogger(['common-core', 'requester'])
logger.debug('Retrying request', { attempt: 1 })
logger.getChild('http').warn('Slow response')
```

### Configure LogTape in the application

```js
import { getLogger as getLogTapeLogger } from '@logtape/logtape'
import { setLogger } from '@kalisio/common-core/runtime'

setLogger(category => getLogTapeLogger(category))
```

The application may add its own prefix, while components keep their declared categories:

```js
setLogger(category => getLogTapeLogger(['kalisio', ...category]))
```

### Reset logging

```js
setLogger() // Restores console for all facades.
```
