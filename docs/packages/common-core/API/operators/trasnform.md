---
title: transform
description: Transform an object or array through a pipeline of mapping, filtering, and conversion operations.
---

# transform

## Signature

```js
transform(obj, options)
```

## Description

Applies a pipeline of transformations to an object or array. Operations are applied in the following order: `toArray` → `toObjects` → `filter` → `mapping` → `unitMapping` → `pick` / `omit` / `merge` → output normalisation.

By default, transformations are applied in place — the original input is mutated.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object \| array` | yes | The input to transform |
| `options` | `object` | yes | Transformation options |
| `options.toArray` | `boolean` | no | Convert a plain object to an array of its values |
| `options.toObjects` | `string[]` | no | Convert an array of arrays to an array of objects using the given keys |
| `options.filter` | `object` | no | A [sift](https://github.com/crcn/sift.js) query to filter array elements |
| `options.inPlace` | `boolean` | no | Whether to mutate the original input. Defaults to `true` |
| `options.mapping` | `object` | no | Rename or remap keys — see [mapping](#mapping) |
| `options.unitMapping` | `object` | no | Convert values — see [unitMapping](#unitmapping) |
| `options.pick` | `string[]` | no | Keep only the listed properties |
| `options.omit` | `string[]` | no | Remove the listed properties |
| `options.merge` | `object` | no | Merge additional properties into each element |
| `options.asArray` | `boolean` | no | Return result as an array even if input was a plain object |
| `options.asObject` | `boolean` | no | Return the first element when input is an array |

## Returns

| Type | Description |
|------|-------------|
| `object \| array` | The transformed result. Type matches the input unless `asArray` or `asObject` is set |

## Throws

Throws a `TypeError` if `obj` is not a plain object or array, or if `options` is not a plain object.

---

## mapping

Renames or remaps keys. Each entry maps an input path to an output path.

```js
options.mapping = {
  [inputPath]: outputPath | { path, values?, delete? }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `outputPath` | `string` | Target key path |
| `path` | `string` | Target key path (object form) |
| `values` | `object` | Map input values to output values |
| `delete` | `boolean` | Whether to delete the input key after mapping. Defaults to `true` |

---

## unitMapping

Converts values at given paths. Each entry maps a path to a conversion descriptor.

```js
options.unitMapping = {
  [path]: { asNumber?, asString?, asDate?, asCase?, from?, to?, empty? }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `asNumber` | `boolean` | Convert value to a number |
| `asString` | `number \| boolean` | Convert value to a string. Pass a radix number for base conversion (e.g. `16` for hex) |
| `asDate` | `'utc' \| boolean` | Parse value as a date. Use `'utc'` for UTC parsing |
| `from` | `string` | Input format (moment format string) or source unit for physical conversion |
| `to` | `string` | Output format (moment format string) or target unit for physical conversion |
| `asCase` | `string` | Apply a lodash case function after conversion (e.g. `'camelCase'`, `'snakeCase'`, `'kebabCase'`) |
| `empty` | `*` | Fallback value to set if the path is missing from the object |

---

## Examples

```js
// Rename a key
transform({ a: 1 }, { mapping: { a: 'b' } })
// { b: 1 }
```

```js
// Map values
transform({ status: 1 }, {
  mapping: { status: { path: 'label', values: { 1: 'active', 0: 'inactive' } } }
})
// { label: 'active' }
```

```js
// Convert string to number
transform({ n: '42' }, { unitMapping: { n: { asNumber: true } } })
// { n: 42 }
```

```js
// Convert number to hex string
transform({ n: 255 }, { unitMapping: { n: { asString: 16 } } })
// { n: 'ff' }
```

```js
// Format a date
transform({ ts: '2024-01-15' }, {
  unitMapping: { ts: { asDate: 'utc', from: 'YYYY-MM-DD', to: 'DD/MM/YYYY' } }
})
// { ts: '15/01/2024' }
```

```js
// Convert physical units
transform({ d: 1 }, { unitMapping: { d: { from: 'km', to: 'mile' } } })
// { d: 0.621371 }
```

```js
// Apply case after conversion
transform({ label: 'hello world' }, { unitMapping: { label: { asString: true, asCase: 'camelCase' } } })
// { label: 'helloWorld' }
```

```js
// Full pipeline
transform(
  [['Alice', 30], ['Bob', 17], ['Carol', 25]],
  {
    toObjects: ['name', 'age'],
    filter: { age: { $gte: 18 } },
    pick: ['name']
  }
)
// [{ name: 'Alice' }, { name: 'Carol' }]
```

```js
// Immutable transform
const json = [{ a: 1 }]
transform(json, { mapping: { a: 'b' }, inPlace: false })
// json is unchanged: [{ a: 1 }]
```