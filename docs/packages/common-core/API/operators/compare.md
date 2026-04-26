---
title: compare
description: Deep comparison of two objects or arrays, with optional normalization options.
---

# compare

## Signature

```js
compare(obj1, obj2, options = {})
```

## Description

Deeply compares two objects or arrays after normalizing them. Returns whether they are equal and a detailed diff of their differences. Differences are reported using dot notation for object keys (`a.b.c`) and bracket notation for array indices (`[0]`, `[1][2].key`).

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj1` | `object \| array` | yes | The reference object or array |
| `obj2` | `object \| array` | yes | The object or array to compare against |
| `options` | `object` | no | Normalization options passed to `object.normalize` |
| `options.ignoredKeys` | `string[]` | no | Keys to ignore during comparison |
| `options.ignoreCase` | `boolean` | no | Ignore case on string values |
| `options.ignoreDiacritics` | `boolean` | no | Ignore diacritics on string values |
| `options.ignoreSpaces` | `boolean` | no | Normalize whitespace on string values |

## Returns

| Type | Description |
|------|-------------|
| `object` | Result object with `isEqual` and `differences` |
| `result.isEqual` | `boolean` — whether the two inputs are equal after normalization |
| `result.differences.missing` | `string[]` — paths present in `obj1` but not in `obj2` |
| `result.differences.extra` | `string[]` — paths present in `obj2` but not in `obj1` |
| `result.differences.updated` | `{ path, oldValue, newValue }[]` — paths with different values |

## Throws

Throws a `TypeError` if `obj1` or `obj2` is not a plain object or array.

## Examples

```js
// Simple object comparison
compare({ a: 1, b: 2 }, { a: 1, b: 3 })
// {
//   isEqual: false,
//   differences: {
//     missing: [],
//     extra: [],
//     updated: [{ path: 'b', oldValue: 2, newValue: 3 }]
//   }
// }
```

```js
// Key order does not matter
compare({ b: 2, a: 1 }, { a: 1, b: 2 })
// { isEqual: true, differences: { missing: [], extra: [], updated: [] } }
```

```js
// Nested differences
compare({ a: { b: 1, c: 2 } }, { a: { b: 1 } })
// {
//   isEqual: false,
//   differences: {
//     missing: ['a.c'],
//     extra: [],
//     updated: []
//   }
// }
```

```js
// Array comparison
compare([{ a: 1 }, { b: 2 }], [{ a: 99 }, { b: 2 }, { c: 3 }])
// {
//   isEqual: false,
//   differences: {
//     missing: [],
//     extra: ['[2]'],
//     updated: [{ path: '[0].a', oldValue: 1, newValue: 99 }]
//   }
// }
```

```js
// With normalization options
compare({ a: 'Héllo' }, { a: 'hello' }, { ignoreCase: true, ignoreDiacritics: true })
// { isEqual: true, differences: { missing: [], extra: [], updated: [] } }
```

```js
// Ignored keys
compare({ a: 1, b: 'foo' }, { a: 1, b: 'bar' }, { ignoredKeys: ['b'] })
// { isEqual: true, differences: { missing: [], extra: [], updated: [] } }
```