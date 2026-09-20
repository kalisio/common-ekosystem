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

Applies a pipeline of transformations to an object or array.

Operations are applied in the following order: `toArray` → `toObjects` → `filter` → optional clone → `mapping` → `unitMapping` → `pick` / `omit` / `merge` → output normalization.

By default, transformations are applied in place. Set `inPlace` to `false` to clone the data before applying `mapping`, `unitMapping`, `pick`, `omit`, and `merge`.

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `obj`                 | `object \| array` | yes | The input to transform |
| `options`             | `object` | yes | Transformation options |
| `options.toArray`     | `boolean` | no | Convert a plain object to an array of its values |
| `options.toObjects`   | `string[]` | no | Convert an array of arrays to an array of objects using the given keys |
| `options.filter`      | `object` | no | A [sift](https://github.com/crcn/sift.js) query to filter array elements |
| `options.inPlace`     | `boolean` | no | Whether transformations mutate existing objects. Defaults to `true` |
| `options.mapping`     | `object` | no | Rename or remap keys — see [mapping](#mapping) |
| `options.unitMapping` | `object` | no | Convert values — see [unitMapping](#unitmapping) |
| `options.pick`        | `string[]` | no | Keep only the listed properties |
| `options.omit`        | `string[]` | no | Remove the listed properties |
| `options.merge`       | `object` | no | Merge additional properties into each element |
| `options.asArray`     | `boolean` | no | Return the result as an array even if the input was a plain object |
| `options.asObject`    | `boolean` | no | Return the first element when the input was an array |

## Returns

| Type  | Description |
| --- | --- |
| `object \| array` | The transformed result. Type matches the input unless `asArray` or `asObject` is set |

## Throws

Throws a `TypeError` if:

* `obj` is not a plain object or array
* `options` is not a plain object
* `toObjects` is used on a value that is not an array of arrays
* `options.toObjects` is not a non-empty array of non-empty strings
* a `mapping` output is neither a non-empty path nor an object containing a non-empty `path`
* a `unitMapping` descriptor is not a plain object

---

## mapping

Renames or remaps properties. Each entry maps an input path to an output path.

```js
options.mapping = {
  [inputPath]: outputPath | { path, values?, delete? }
}
```

| Property | Type | Description |
| --- | --- | --- |
| `outputPath` | `string`  | Target property path |
| `path`       | `string`  | Target property path when using the object form |
| `values`     | `object`  | Map input values to output values |
| `delete`     | `boolean` | Delete the input path after mapping. Defaults to `true` |

All source values are read before mapped values are written. This allows fields to be safely swapped or mapped to each other's paths.

When `values` is provided and the source value is not present in the lookup table, the original value is preserved.

```js
transform(
  { first: 'Alice', last: 'Doe' },
  { mapping: { first: 'last', last: 'first' } }
)

// { first: 'Doe', last: 'Alice' }
```

```js
transform(
  { status: 2 },
  {
    mapping: {
      status: {
        path: 'label',
        values: {
          1: 'active',
          0: 'inactive'
        }
      }
    }
  }
)

// { label: 2 }
```

---

## unitMapping

Converts or transforms values at given paths. Each entry maps a path to a conversion descriptor.

```js
options.unitMapping = {
  [path]: {
    asNumber?,
    asString?,
    asDate?,
    asCase?,
    from?,
    to?,
    empty?
  }
}
```

| Property   | Type                | Description                                                            |
| ---------- | ------------------- | ---------------------------------------------------------------------- |
| `asNumber` | `boolean`           | Convert the value to a number                                          |
| `asString` | `number \| boolean` | Convert the value to a string. Pass a radix number for base conversion |
| `asDate`   | `'utc' \| boolean`  | Parse the value as a date. Use `'utc'` for UTC parsing                 |
| `from`     | `string`            | Input date format or source physical unit                              |
| `to`       | `string`            | Output date format or target physical unit                             |
| `asCase`   | `string`            | Apply a string case transformation                                     |
| `empty`    | `*`                 | Value to set when the path does not exist                              |

If no conversion option is provided, the original value is preserved before applying `asCase`.

### Case transformations

`asCase` supports the following string utilities:

* `camelCase`
* `pascalCase`
* `kebabCase`
* `snakeCase`
* `constantCase`
* `dotCase`
* `startCase`
* `upperCase`
* `lowerCase`
* `capitalize`

Native `String` methods can also be used, for example `toUpperCase`.

An unknown case function leaves the value unchanged.

---

## Examples

```js
// Rename a property

transform({ a: 1 }, {
  mapping: { a: 'b' }
})

// { b: 1 }
```

```js
// Map a value

transform(
  { status: 1 },
  {
    mapping: {
      status: {
        path: 'label',
        values: {
          1: 'active',
          0: 'inactive'
        }
      }
    }
  }
)

// { label: 'active' }
```

```js
// Convert a string to a number

transform(
  { n: '42' },
  {
    unitMapping: {
      n: { asNumber: true }
    }
  }
)

// { n: 42 }
```

```js
// Convert a number to an hexadecimal string

transform(
  { n: 255 },
  {
    unitMapping: {
      n: { asString: 16 }
    }
  }
)

// { n: 'ff' }
```

```js
// Format a date

transform(
  { ts: '2024-01-15' },
  {
    unitMapping: {
      ts: {
        asDate: 'utc',
        from: 'YYYY-MM-DD',
        to: 'DD/MM/YYYY'
      }
    }
  }
)

// { ts: '15/01/2024' }
```

```js
// Convert physical units

transform(
  { distance: 1 },
  {
    unitMapping: {
      distance: {
        from: 'km',
        to: 'mile'
      }
    }
  }
)

// { distance: 0.621371... }
```

```js
// Apply a case transformation directly

transform(
  { label: 'hello world' },
  {
    unitMapping: {
      label: {
        asCase: 'camelCase'
      }
    }
  }
)

// { label: 'helloWorld' }
```

```js
// Use another string case utility

transform(
  { label: 'helloWorld' },
  {
    unitMapping: {
      label: {
        asCase: 'startCase'
      }
    }
  }
)

// { label: 'Hello World' }
```

```js
// Provide a fallback value for a missing property

transform(
  { name: 'Alice' },
  {
    unitMapping: {
      age: {
        empty: 0
      }
    }
  }
)

// { name: 'Alice', age: 0 }
```

```js
// Convert rows to objects, filter them, then pick properties

transform(
  [
    ['Alice', 30],
    ['Bob', 17],
    ['Carol', 25]
  ],
  {
    toObjects: ['name', 'age'],
    filter: {
      age: { $gte: 18 }
    },
    pick: ['name']
  }
)

// [
//   { name: 'Alice' },
//   { name: 'Carol' }
// ]
```

```js
// Immutable transform

const data = [{ a: 1 }]

const result = transform(data, {
  mapping: { a: 'b' },
  inPlace: false
})

// data
// [{ a: 1 }]

// result
// [{ b: 1 }]
```
