---
title: object
description: Utility functions for cloning and normalizing plain objects and arrays.
---

# object

## clone

### Signature

```js
object.clone(obj)
```

### Description

Returns a deep clone of the given value using `structuredClone`. The clone shares no references with the original.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `*` | yes | The value to clone |

### Returns

| Type | Description |
|------|-------------|
| `*` | A deep clone of `obj` |

### Throws

Throws a `TypeError` if `obj` is `null` or `undefined`.

### Examples

```js
const original = { a: { b: 1 } }
const cloned = object.clone(original)
cloned.a.b = 99
// original.a.b is still 1
```

---

## normalize

### Signature

```js
object.normalize(obj, options = {})
```

### Description

Recursively normalizes a plain object or array to produce a canonical, comparable form. The following transformations are applied:

- **Objects** — keys are sorted alphabetically, ignored keys are removed
- **Arrays** — elements are recursively normalized then sorted by their JSON representation
- **Strings** — normalized via `string.normalize` with the given options
- **Other primitives** — returned as-is
- **`null` / `undefined`** — returned as-is without recursing

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `*` | yes | The value to normalize |
| `options` | `object` | no | Normalization options |
| `options.ignoredKeys` | `string[]` | no | Keys to exclude from objects, applied recursively |
| `options.ignoreCase` | `boolean` | no | Lowercase string values |
| `options.ignoreDiacritics` | `boolean` | no | Strip diacritics from string values |
| `options.ignoreSpaces` | `boolean` | no | Normalize whitespace in string values |

### Returns

| Type | Description |
|------|-------------|
| `*` | The normalized value |

### Throws

Throws a `TypeError` if `obj` is `null` or `undefined`.

### Examples

```js
// Sort keys alphabetically
object.normalize({ c: 3, a: 1, b: 2 })
// { a: 1, b: 2, c: 3 }
```

```js
// Sort nested keys recursively
object.normalize({ b: { d: 4, c: 3 }, a: 1 })
// { a: 1, b: { c: 3, d: 4 } }
```

```js
// Ignore specific keys
object.normalize({ a: 1, b: 2, c: 3 }, { ignoredKeys: ['b'] })
// { a: 1, c: 3 }
```

```js
// Normalize string values
object.normalize({ a: 'Héllo' }, { ignoreCase: true, ignoreDiacritics: true })
// { a: 'hello' }
```

```js
// Sort array elements
object.normalize({ a: [3, 1, 2] })
// { a: [1, 2, 3] }
```