---
title: transform
description: Orchestrates a configurable pipeline of conversions, filters, and transformations on a JSON value. The single entry point for all data-shaping operations.
---

# transform

## transform

### Signature

```js
transform (json, options)
```

### Description

Applies a configurable sequence of transformations to a JSON value (object or array). Steps are executed in the following order when the corresponding option is present:

1. **`toArray`** — convert an object to an array of its values (`convert.toArray`).
2. **`toObjects`** — convert an array of arrays to an array of objects (`convert.toObjects`).
3. **`filter`** — keep only elements matching a MongoDB-style query (`filter`).
4. **`mapping`** — remap property keys and values (`apply.mapping`).
5. **`unitMapping`** — convert property values between units or formats (`apply.unitMapping`).
6. **`pick` / `omit` / `merge`** — select, remove, or inject properties (`apply.modifier`).

By default the input array is mutated in place. Set `inPlace: false` to work on a deep clone instead.

When a plain object is passed as `json`, it is wrapped in an array internally before processing, then unwrapped back to an object before being returned—unless `asArray: true` is set. Conversely, when an array is passed and `asObject: true` is set, only the first element is returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `json` | `object \| Array` | yes | The JSON value to transform |
| `options` | `object` | yes | A plain object describing the transformation pipeline |
| `options.toArray` | `boolean` | no | Convert the input object to an array of its values before further processing |
| `options.toObjects` | `string[]` | no | Array of key names used to convert an array of arrays to an array of objects |
| `options.filter` | `object` | no | MongoDB-style query object passed to [filter](./filter.md#filter) |
| `options.inPlace` | `boolean` | no | When `false`, performs transformations on a deep clone. Defaults to `true` |
| `options.mapping` | `object` | no | Mapping descriptor passed to [apply.mapping](./apply.md#mapping) |
| `options.unitMapping` | `object` | no | Unit mapping descriptor passed to [apply.unitMapping](./apply.md#unitmapping)` |
| `options.pick` | `string[]` | no | Property paths to keep on each object, passed to [apply.modifier](./apply.md#modifier)` |
| `options.omit` | `string[]` | no | Property paths to remove from each object, passed to [apply.modifier](./apply.md#modifier) |
| `options.merge` | `object` | no | Object to deep-merge into each element, passed to [apply.modifier](./apply.md#modifier) |
| `options.asArray` | `boolean` | no | When `json` was a plain object, return the result as an array instead of unwrapping it |
| `options.asObject` | `boolean` | no | When `json` was an array, return only the first element as a plain object |

### Returns

| Type | Description |
|------|-------------|
| `object \| Array` | The transformed value. Type matches the input type unless `asArray` or `asObject` override it. Returns `{}` or `[]` when the resulting collection is empty |

### Examples

```js
// Rename a key
transform(
  [{ firstName: 'Alice' }, { firstName: 'Bob' }],
  { mapping: { firstName: 'name' } }
)
// => [{ name: 'Alice' }, { name: 'Bob' }]
```

```js
// Convert units and filter
transform(
  [{ speed: 10 }, { speed: 3 }, { speed: 7 }],
  {
    unitMapping: { speed: { from: 'm/s', to: 'km/h' } },
    filter: { speed: { $gte: 25 } }
  }
)
// => [{ speed: 36 }, { speed: 25.2 }]
```

```js
// Convert a plain object to an array of its values, then map to objects
transform(
  { 0: ['Alice', 25], 1: ['Bob', 17] },
  {
    toArray: true,
    toObjects: ['name', 'age']
  }
)
// => [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 17 }]
```

```js
// Work on a clone instead of mutating the input
const input = [{ a: 1 }]
const result = transform(input, { inPlace: false, merge: { b: 2 } })
// result  => [{ a: 1, b: 2 }]
// input   => [{ a: 1 }]  (unchanged)
```

```js
// Unwrap a single object result as an array
transform({ name: 'Alice' }, { asArray: true, merge: { role: 'admin' } })
// => [{ name: 'Alice', role: 'admin' }]
```

```js
// throws TypeError: 'json must be an object or an array'
transform('invalid', {})

// throws TypeError: 'options must be an object'
transform([{ a: 1 }], null)
```
