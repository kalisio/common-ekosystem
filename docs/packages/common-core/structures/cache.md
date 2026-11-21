
---
title: Cache
description: LRU cache with optional entry limit and time-to-live expiration.
---

# Cache

An in-memory least-recently-used (LRU) cache extending `Registry`. Supports an optional maximum number of entries and time-to-live (TTL) expiration, without timers or external dependencies.

## Constructor

### Signature

```js
new Cache(name = 'cache', { max = Infinity, ttl = 0 } = {})
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | no | Non-empty cache name. Defaults to `'cache'`. |
| `max` | `number` | no | Maximum number of entries: a positive integer or `Infinity` (default). |
| `ttl` | `number` | no | Lifetime of each entry in milliseconds. A non-negative integer; `0` (default) disables expiration. |

### Example

```js
import { Cache } from '@kalisio/common-core/structures'

const cache = new Cache('svg', { max: 100, ttl: 60_000 })
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Cache name (inherited, read-only). |
| `max` | `number` | Maximum number of entries (read-only). |
| `ttl` | `number` | Entry lifetime in milliseconds (read-only). |
| `size` | `number` | Number of non-expired entries (read-only). Expired entries are pruned before counting. |

## set

### Signature

```js
cache.set(key, value)
```

Inserts or replaces an entry. Returns the stored value. The key must be a non-empty string and the value must not be `null` or `undefined`.

Replacing an entry refreshes its LRU position and its TTL.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | yes | Non-empty cache key. |
| `value` | `any` | yes | Value to store, excluding `null` and `undefined`. |

### Example

```js
cache.set('icon', '<svg>...</svg>')
cache.set('icon', '<svg>updated</svg>')
```

## get and has

### Signatures

```js
cache.get(key)
cache.has(key)
```

`get()` returns the cached value or `undefined` if absent or expired. A successful `get()` marks an entry as most recently used, **without** renewing its TTL.

`has()` returns a boolean without changing LRU order. Both methods discard the requested entry if it has expired.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `string` | yes | Non-empty cache key. |

### Example

```js
const recent = new Cache('recent', { max: 2 })
recent.set('a', 1)
recent.set('b', 2)
recent.get('a') // 1 — 'a' becomes most recently used
recent.set('c', 3) // Evicts 'b'
recent.has('b') // false
```

## getOrSet

### Signature

```js
cache.getOrSet(key, compute)
```

Returns an existing cached value, or calls `compute(key)`, stores its result, and returns it. Cache hits refresh LRU recency but not TTL. The computation is performed only on a miss.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | yes | Non-empty cache key. |
| `compute` | `(key: string) => any` | yes | Function computing a defined value on a cache miss. |

### Returns

The cached or newly computed value. If `compute` returns a promise, the promise itself is cached and returned, allowing concurrent calls to share the same computation. **A rejected promise remains cached** until removed, evicted, or expired. If `compute` throws synchronously, nothing is stored.

### Example

```js
const metadata = cache.getOrSet('osm', key => ({ key, loaded: true }))

const requests = new Cache('requests', { max: 50 })
const result = await requests.getOrSet('users', () => fetchUsers())
```

## register and replace

### Signatures

```js
cache.register(key, value)
cache.replace(key, value)
```

These methods are inherited from `Registry` but use cache expiration and eviction rules:

- `register()` adds only if no live entry exists; it rejects duplicate live keys.
- `replace()` replaces only an existing live entry; it rejects absent or expired keys.
- Both writes refresh the entry's LRU position and TTL.
- Use `set()` when either insertion or replacement should be allowed.

Both methods return the written value.

## keys, values and entries

### Signatures

```js
cache.keys()
cache.values()
cache.entries()
```

Return arrays of non-expired entries, ordered from **least recently used to most recently used**. Expired entries are pruned first. These methods do not refresh LRU recency.

```js
cache.keys() // ['least-recent', 'most-recent']
```

## unregister and clear

### Signatures

```js
cache.unregister(key)
cache.clear()
```

`unregister(key)` removes the entry and its TTL metadata, returning a boolean. `clear()` removes all entries and expiration metadata.

## Expiration and eviction

- When inserting beyond `max`, expired entries are pruned first; if necessary, the least recently used live entries are evicted.
- Entries expire `ttl` milliseconds after insertion or replacement. Reading a value does not extend this lifetime.
- Expiration is **lazy**: entries are removed when checked, when enumerating or counting, or when pruning before eviction. No background timer is started.
- With `max: Infinity` and `ttl: 0`, the cache has neither an entry limit nor expiration.

```js
const images = new Cache('images', { max: 2, ttl: 30_000 })
images.set('first', '...')
images.set('second', '...')
images.get('first')
images.set('third', '...') // Evicts 'second'
```
