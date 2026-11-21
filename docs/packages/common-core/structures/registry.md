
---
title: Registry
description: Generic named registry for storing and retrieving values by key.
---

# Registry

A generic, named registry for storing and retrieving values by string keys. Values can be objects, instances, classes, functions, or any other defined value.

## Constructor

### Signature

```js
new Registry(name = 'registry')
```

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | no | Non-empty registry name, used in error messages. Defaults to `'registry'`. |

### Example

```js
import { Registry } from '@kalisio/common-core/structures'

const registry = new Registry('layers')
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Registry name (read-only). |
| `size` | `number` | Number of registered entries (read-only). |

## register

### Signature

```js
registry.register(key, value)
```

Adds a new entry. Throws if the key is already registered. The key must be a non-empty string, and the value must not be `null` or `undefined`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | yes | Non-empty entry key. |
| `value` | `any` | yes | Value to register, excluding `null` and `undefined`. |

### Returns

The registered `value`.

### Example

```js
registry.register('osm', { type: 'tile' })
registry.register('active', false)

registry.register('osm', {})
// Error: [layers] entry already registered: osm
```

## replace

### Signature

```js
registry.replace(key, value)
```

Replaces an existing entry. Throws if the key is not registered. Replacing a value preserves its position in insertion order.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | yes | Key of an existing entry. |
| `value` | `any` | yes | Replacement value, excluding `null` and `undefined`. |

### Returns

The replacement `value`.

### Example

```js
registry.replace('osm', { type: 'vector' })

registry.replace('missing', {})
// Error: [layers] entry not registered: missing
```

## get and has

### Signatures

```js
registry.get(key)
registry.has(key)
```

`get()` returns the stored value or `undefined` if the key is absent. `has()` returns a boolean without changing the registry.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `string` | yes | Non-empty entry key. |

### Example

```js
registry.get('osm') // { type: 'vector' }
registry.has('osm') // true
registry.get('missing') // undefined
registry.has('missing') // false
```

## keys, values and entries

### Signatures

```js
registry.keys()
registry.values()
registry.entries()
```

Return arrays in insertion order. These arrays are snapshots, not live iterators; stored object values retain their references.

| Method | Returns |
|--------|---------|
| `keys()` | `string[]` |
| `values()` | `any[]` |
| `entries()` | `[string, any][]` |

### Example

```js
const sources = new Registry('sources')
sources.register('osm', 1)
sources.register('satellite', 2)

sources.keys() // ['osm', 'satellite']
sources.values() // [1, 2]
sources.entries() // [['osm', 1], ['satellite', 2]]
```

## unregister and clear

### Signatures

```js
registry.unregister(key)
registry.clear()
```

`unregister(key)` removes an entry and returns `true` if it existed, or `false` otherwise. `clear()` removes all entries and returns `undefined`.

### Example

```js
registry.unregister('osm') // true
registry.unregister('osm') // false
registry.clear()
registry.size // 0
```

## Extending Registry

Subclasses can override `_validateEntry(key, value)` to add validation and `_set(key, value)` to customize writes. `_firstKey()` retrieves the oldest key in insertion order without copying the entries. These methods are extension points; prefer the public methods for normal use.

```js
class CommandRegistry extends Registry {
  _validateEntry (key, command) {
    super._validateEntry(key, command)
    // Add command-specific validation here.
  }
}
```
