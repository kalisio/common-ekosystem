---
title: Factory
description: Registry of creator functions for constructing values on demand.
---

# Factory

A specialized `Registry` that stores creator functions and invokes them to construct values on demand. Each call to `create()` invokes the registered creator; created values are not cached.

## Constructor

### Signature

```js
new Factory(name = 'factory')
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | no | Non-empty factory name, used in errors. Defaults to `'factory'`. |

### Example

```js
import { Factory } from '@kalisio/common-core/structures'

const engines = new Factory('engines')
```

## register

### Signature

```js
factory.register(key, creator)
```

Registers a creator function under a non-empty string key. Throws if the key already exists. A creator can return any value, including a promise.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | yes | Non-empty creator key. |
| `creator` | `function` | yes | Function invoked by `create()`. |

### Returns

The registered creator function.

### Example

```js
engines.register('maplibre', options => new MapLibreEngine(options))
engines.register('cesium', options => new CesiumEngine(options))
```

Pass a factory function when creating a class instance. A class constructor cannot be invoked directly as `creator(...args)`.

## replace

### Signature

```js
factory.replace(key, creator)
```

Replaces an existing creator function. Throws if the key is not registered or if the new creator is invalid. Preserves the entry's insertion order and returns the new creator.

### Example

```js
engines.replace('maplibre', options => new CustomMapLibreEngine(options))
```

## create

### Signature

```js
factory.create(key, ...args)
```

Looks up the registered creator and invokes it as `creator(...args)`. Throws `[name] unknown key: key` if no creator is registered. Exceptions from the creator are propagated to the caller.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | yes | Non-empty registered key. |
| `...args` | `any[]` | no | Arguments forwarded to the creator. |

### Returns

Whatever the creator returns, including a promise for an asynchronous creator.

### Example

```js
const engine = engines.create('maplibre', { style: 'streets' })

engines.create('unknown')
// Error: [engines] unknown key: unknown
```

Asynchronous creators are supported:

```js
const services = new Factory('services')
services.register('api', async options => createApiService(options))

const service = await services.create('api', { endpoint: '/api' })
```

## Other inherited methods

`Factory` inherits the lookup and management API of `Registry`:

| Member | Description |
|--------|-------------|
| `name` | Factory name. |
| `size` | Number of registered creators. |
| `get(key)` | Returns a creator or `undefined`. |
| `has(key)` | Checks whether a creator is registered. |
| `keys()` | Returns registered keys in insertion order. |
| `values()` | Returns creator functions in insertion order. |
| `entries()` | Returns `[key, creator]` pairs in insertion order. |
| `unregister(key)` | Removes a creator, returning a boolean. |
| `clear()` | Removes all registered creators. |

```js
engines.has('maplibre') // true
engines.keys() // ['maplibre', 'cesium']
engines.unregister('cesium') // true
```
