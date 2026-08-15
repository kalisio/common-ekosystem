---
title: object
description: Utility functions for cloning, normalizing, sorting, and reordering plain objects and arrays.
---

# object

Utility functions for cloning, normalizing, sorting, and reordering plain objects and arrays.

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

Key and element ordering always uses a strict, accent- and case-sensitive comparison — `options.ignoreDiacritics` and `options.ignoreCase` only affect how string *values* are normalized, not the sort order of keys or array elements. `options.locale` is honored for both.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object \| array` | yes | The array or plain object to normalize |
| `options` | `object` | no | Normalization options |
| `options.ignoredKeys` | `string[]` | no | Keys to exclude from objects, applied recursively |
| `options.ignoreCase` | `boolean` | no | Lowercase string values. Defaults to `false` |
| `options.ignoreDiacritics` | `boolean` | no | Strip diacritics from string values. Defaults to `false` |
| `options.ignoreSpaces` | `boolean` | no | Normalize whitespace in string values. Defaults to `false` |
| `options.locale` | `string` | no | Locale used for key/element ordering and, if `ignoreCase` is set, for string value normalization. Defaults to system locale |

### Returns

| Type | Description |
|------|-------------|
| `object \| array` | The normalized value |

### Throws

Throws a `TypeError` if `obj` is not an array or a plain object, or if `options` does not conform to the expected schema.

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

## reorder

### Signature

```js
object.reorder(obj, property, options = {})
```

### Description

Reorders the keys of a plain object based on a given string property of its values, so that iterating the result (`Object.entries`, `Object.keys`, `JSON.stringify`, ...) follows that order. Comparison is delegated to `string.compare`, so accented and case-insensitive sorting is applied by default. Keys and their associated values are preserved — only the order changes. Does not mutate the input.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The objionary to reorder |
| `property` | `string` | yes | The property name to reorder by. Must resolve to a string value on every entry |
| `options` | `object` | no | Comparison options, forwarded to `string.compare` |
| `options.ignoreSpaces` | `boolean` | no | Ignore leading/trailing/multiple spaces when comparing. Defaults to `false` |
| `options.ignoreDiacritics` | `boolean` | no | Ignore diacritics when comparing. Defaults to `true` |
| `options.ignoreCase` | `boolean` | no | Ignore case when comparing. Defaults to `true` |
| `options.locale` | `string` | no | Locale passed to the underlying comparison. Defaults to system locale |

### Returns

| Type | Description |
|------|-------------|
| `object` | A new object with the same keys and values, reordered by `property` |

### Throws

Throws a `TypeError` if `obj` is not a plain object, if `property` is not a string, if `options` does not conform to the expected schema, or if the resolved property value on any entry is not a string.

### Examples

```js
object.reorder(
  { z: { label: 'zèbre' }, a: { label: 'abricot' } },
  'label'
)
// { a: { label: 'abricot' }, z: { label: 'zèbre' } }
```

````md
## lookup

### Signature

```js
object.lookup(obj, path)
````

### Description

Returns the value reachable from an object or array through a dot-separated path.

The path can traverse both object properties and array indexes. If any segment of the path does not exist, `undefined` is returned.

Falsy values such as `false`, `0`, and `null` are returned as-is.

### Parameters

| Name   | Type     | Required | Description                              |
| ------ | -------- | -------- | ---------------------------------------- |
| `obj`  | `*`      | yes      | The value from which to start the lookup |
| `path` | `string` | yes      | Dot-separated path to the value          |

### Returns

| Type             | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `* \| undefined` | The value found at `path`, or `undefined` if the path cannot be resolved |

### Throws

Throws a `TypeError` if `obj` is `null` or `undefined`, or if `path` is not a non-empty string.

### Examples

```js
object.lookup({ a: { b: 1 } }, 'a.b')
// 1
```

```js
object.lookup(
  { items: [{ name: 'first' }, { name: 'second' }] },
  'items.1.name'
)
// 'second'
```

```js
object.lookup({ a: { b: false } }, 'a.b')
// false

object.lookup({ a: { b: 0 } }, 'a.b')
// 0

object.lookup({ a: { b: null } }, 'a.b')
// null
```

```js
object.lookup({ a: {} }, 'a.b')
// undefined
```

## dotify

### Signature

```js
object.dotify(obj)
```

### Description

Flattens a nested object into a single-level object using dot notation keys. Recursively traverses all nested objects and builds a flat key from the path to each leaf value.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The plain object to flatten |

### Returns

| Type | Description |
|------|-------------|
| `object` | A flat object with dot-notation keys |

### Throws

Throws a `TypeError` if `obj` is not a plain object.

### Examples

```js
object.dotify({ a: { b: { c: 1 }, d: 2 }, e: 3 })
// { 'a.b.c': 1, 'a.d': 2, 'e': 3 }

object.dotify({ a: 1, b: 2 })
// { a: 1, b: 2 }

object.dotify({ a: { b: null } })
// { 'a.b': null }

object.dotify({})
// {}
```

## sort

### Signature

```js
object.sort(arr, property, options = {})
```

### Description

Sorts an array of objects by a given string property. Comparison is delegated to `string.compare`, so accented and case-insensitive sorting is applied by default. Does not mutate the input.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `arr` | `array` | yes | The array to sort |
| `property` | `string` | yes | The property name to sort by. Must resolve to a string value on every item |
| `options` | `object` | no | Comparison options, forwarded to `string.compare` |
| `options.ignoreSpaces` | `boolean` | no | Ignore leading/trailing/multiple spaces when comparing. Defaults to `false` |
| `options.ignoreDiacritics` | `boolean` | no | Ignore diacritics when comparing. Defaults to `true` |
| `options.ignoreCase` | `boolean` | no | Ignore case when comparing. Defaults to `true` |
| `options.locale` | `string` | no | Locale passed to the underlying comparison. Defaults to system locale |

### Returns

| Type | Description |
|------|-------------|
| `array` | A new array sorted by `property` |

### Throws

Throws a `TypeError` if `arr` is not an array, if `property` is not a string, if `options` does not conform to the expected schema, or if the resolved property value on any item is not a string.

### Examples

```js
object.sort(
  [{ label: 'zèbre' }, { label: 'étoile' }, { label: 'abricot' }],
  'label'
)
// [{ label: 'abricot' }, { label: 'étoile' }, { label: 'zèbre' }]
```

```js
// Distinguish diacritics
object.sort(
  [{ label: 'ete' }, { label: 'été' }],
  'label',
  { ignoreDiacritics: false }
)
// [{ label: 'ete' }, { label: 'été' }]
```