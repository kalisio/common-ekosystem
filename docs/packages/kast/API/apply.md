---
title: apply
description: Functions that apply in-place transformations to arrays of objects. Used to remap keys, convert units, and pick/omit/merge properties.
---

# apply

## mapping

### Signature

```js
apply.mapping (array, mapping)
```

### Description

Remaps properties of each object in the array according to a mapping descriptor. For each entry in `mapping`, the value found at the input path is moved to the output path. The original property is deleted after the move unless `delete: false` is specified or the input and output paths are identical.

When the output descriptor includes a `values` map, the original value is replaced by its corresponding entry in that map before being written to the output path.

The array is mutated in place.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `array` | `Array` | yes | The array of objects to transform |
| `mapping` | `object` | yes | A plain object where each key is a source path and each value is either a target path string or an output descriptor object |
| `mapping[inputPath]` | `string \| object` | yes | Target path (string), or an output descriptor |
| `mapping[inputPath].path` | `string` | no | Target property path |
| `mapping[inputPath].delete` | `boolean` | no | Whether to delete the source property after mapping. Defaults to `true` |
| `mapping[inputPath].values` | `object` | no | A lookup map to replace the original value before writing |

### Returns

| Type | Description |
|------|-------------|
| `Array` | The same array, mutated in place |

### Examples

```js
// Simple key rename
apply.mapping(
  [{ firstName: 'Alice' }, { firstName: 'Bob' }],
  { firstName: 'name' }
)
// => [{ name: 'Alice' }, { name: 'Bob' }]
```

```js
// Rename and transform value using a lookup map
apply.mapping(
  [{ status: 0 }, { status: 1 }],
  { status: { path: 'label', values: { 0: 'inactive', 1: 'active' } } }
)
// => [{ label: 'inactive' }, { label: 'active' }]
```

```js
// Keep source property while also writing to a new path
apply.mapping(
  [{ a: 1 }],
  { a: { path: 'b', delete: false } }
)
// => [{ a: 1, b: 1 }]
```

```js
// throws TypeError: 'array must be an array'
apply.mapping('not an array', { a: 'b' })

// throws TypeError: 'mapping must be an object'
apply.mapping([{ a: 1 }], null)
```

---

## unitMapping

### Signature

```js
apply.unitMapping (array, unitMapping)
```

### Description

Converts the value at each specified path in every object of the array, using `convert.toValue`. Optionally applies a lodash or native string case transformation afterwards (e.g. `camelCase`, `toUpperCase`). If an object does not have the specified path but the `units` descriptor defines an `empty` fallback, that fallback value is written instead.

The array is mutated in place.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `array` | `Array` | yes | The array of objects to transform |
| `unitMapping` | `object` | yes | A plain object where each key is a dot-notation path and each value is a units descriptor |
| `unitMapping[path].from` | `string` | no | Source unit or date format |
| `unitMapping[path].to` | `string` | no | Target unit or date format |
| `unitMapping[path].asDate` | `string` | no | Treat the value as a date. Use `'utc'` for UTC parsing, any other truthy string for local time |
| `unitMapping[path].asString` | `boolean \| number` | no | Convert the value to a string, optionally using the given radix |
| `unitMapping[path].asNumber` | `boolean` | no | Coerce the value to a number |
| `unitMapping[path].asCase` | `string` | no | Apply a case transformation after conversion — a lodash method (e.g. `'camelCase'`) or a native `String` method (e.g. `'toUpperCase'`) |
| `unitMapping[path].empty` | `*` | no | Fallback value written when the path is absent from the object |

### Returns

| Type | Description |
|------|-------------|
| `Array` | The same array, mutated in place |

### Examples

```js
// Physical unit conversion
apply.unitMapping(
  [{ speed: 10 }, { speed: 20 }],
  { speed: { from: 'm/s', to: 'km/h' } }
)
// => [{ speed: 36 }, { speed: 72 }]
```

```js
// Date formatting
apply.unitMapping(
  [{ date: '2024-01-15' }],
  { date: { asDate: true, to: 'DD/MM/YYYY' } }
)
// => [{ date: '15/01/2024' }]
```

```js
// Apply case transformation after conversion
apply.unitMapping(
  [{ label: 'hello world' }],
  { label: { asString: true, asCase: 'camelCase' } }
)
// => [{ label: 'helloWorld' }]
```

```js
// Write a fallback when the property is absent
apply.unitMapping(
  [{ name: 'Alice' }, {}],
  { score: { asNumber: true, empty: 0 } }
)
// => [{ name: 'Alice' }, { score: 0 }]
```

```js
// throws TypeError: 'array must be an array'
apply.unitMapping('not an array', { speed: { from: 'm/s', to: 'km/h' } })
```

---

## modifier

### Signature

```js
apply.modifier (array, modifier)
```

### Description

Applies a set of structural modifications to each object in the array: property selection (`pick`), property removal (`omit`), and deep merging of additional data (`merge`). Operations are applied in that order. The array is mutated in place.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `array` | `Array` | yes | The array of objects to transform |
| `modifier` | `object` | yes | A plain object describing what operations to apply |
| `modifier.pick` | `string[]` | no | An array of property paths to keep; all other properties are discarded |
| `modifier.omit` | `string[]` | no | An array of property paths to remove |
| `modifier.merge` | `object` | no | A plain object to deep-merge into every element |

### Returns

| Type | Description |
|------|-------------|
| `Array` | The same array, mutated in place |

### Examples

```js
// Keep only selected properties
apply.modifier(
  [{ name: 'Alice', age: 25, password: 'secret' }],
  { pick: ['name', 'age'] }
)
// => [{ name: 'Alice', age: 25 }]
```

```js
// Remove sensitive properties
apply.modifier(
  [{ name: 'Alice', age: 25, password: 'secret' }],
  { omit: ['password'] }
)
// => [{ name: 'Alice', age: 25 }]
```

```js
// Deep-merge default values into every object
apply.modifier(
  [{ name: 'Alice' }, { name: 'Bob' }],
  { merge: { role: 'user', active: true } }
)
// => [{ name: 'Alice', role: 'user', active: true }, { name: 'Bob', role: 'user', active: true }]
```

```js
// Combine multiple operations
apply.modifier(
  [{ name: 'Alice', age: 25, password: 'secret' }],
  { omit: ['password'], merge: { role: 'admin' } }
)
// => [{ name: 'Alice', age: 25, role: 'admin' }]
```

```js
// throws TypeError: 'array must be an array'
apply.modifier('not an array', { pick: ['name'] })

// throws TypeError: 'modifier must be an object'
apply.modifier([{ name: 'Alice' }], null)
```