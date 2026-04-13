---
title: convert
description: Utility functions to convert data structures and values. Used to reshape objects, arrays, and scalar values before further processing.
---

# convert

## toArray

### Signature

```js
convert.toArray (obj)
```

### Description

Converts a plain object into an array of its values, discarding the keys. Thin wrapper around [`_.toArray`](https://lodash.com/docs/#toArray).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `object` | yes | The plain object to convert |

### Returns

| Type | Description |
|------|-------------|
| `Array` | An array of the object's own enumerable values, in insertion order |

### Examples

```js
convert.toArray({ a: 1, b: 2, c: 3 })
// => [1, 2, 3]
```

```js
// throws TypeError: 'obj must be an object'
convert.toArray([1, 2, 3])
```

---

## toObjects

### Signature

```js
convert.toObjects (obj, keys)
```

### Description

Converts an array of arrays into an array of plain objects by zipping each inner array with the provided keys. Each inner array becomes an object whose properties are named after the corresponding key.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `obj` | `Array` | yes | An array of arrays, where each inner array holds the values for one object |
| `keys` | `Array` | yes | A non-empty array of strings used as property names |

### Returns

| Type | Description |
|------|-------------|
| `Array` | An array of plain objects, one per inner array |

### Examples

```js
convert.toObjects([['Alice', 25], ['Bob', 17]], ['name', 'age'])
// => [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 17 }]
```

```js
// throws TypeError: 'obj must be an array'
convert.toObjects({ name: 'Alice' }, ['name'])

// throws TypeError: 'keys must be a non empty array'
convert.toObjects([['Alice', 25]], [])
```

---

## toValue

### Signature

```js
convert.toValue (value, units)
```

### Description

Converts a scalar value according to a `units` descriptor. Supports four modes, selected by the properties present on `units`:

- **Date conversion** (`units.asDate`) — parses `value` as a date using `moment`, optionally from a source format (`units.from`), and returns either a formatted string (`units.to`) or a native `Date` object.
- **String conversion** (`units.asString`) — calls `value.toString()`, optionally with a radix when `units.asString` is a number.
- **Number conversion** (`units.asNumber`) — coerces `value` to a number, removing spaces first when the value is a string.
- **Physical unit conversion** (default) — converts `value` from the unit `units.from` to the unit `units.to` using `mathjs`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `*` | yes | The value to convert |
| `units` | `object` | yes | Descriptor object controlling the conversion mode |
| `units.asDate` | `string` | no | Set to `'utc'` for UTC parsing, or any truthy string for local time parsing |
| `units.asString` | `boolean \| number` | no | Set to `true` to convert to string, or a number to use as radix |
| `units.asNumber` | `boolean` | no | Set to `true` to coerce value to a number |
| `units.from` | `string` | no | Source unit or date format |
| `units.to` | `string` | no | Target unit or date output format |

### Returns

| Type | Description |
|------|-------------|
| `Date \| string \| number` | The converted value, whose type depends on the active conversion mode |

### Examples

```js
// Physical unit conversion
convert.toValue(1, { from: 'km', to: 'm' })
// => 1000

// Date conversion to a formatted string
convert.toValue('2024-01-15', { asDate: true, to: 'DD/MM/YYYY' })
// => '15/01/2024'

// Date conversion in UTC to a native Date object
convert.toValue('2024-01-15T00:00:00Z', { asDate: 'utc' })
// => Date object

// Date conversion from a custom input format
convert.toValue('15/01/2024', { asDate: true, from: 'DD/MM/YYYY', to: 'YYYY-MM-DD' })
// => '2024-01-15'

// Number to binary string
convert.toValue(255, { asString: 2 })
// => 'ff'

// String with spaces to number
convert.toValue('1 234', { asNumber: true })
// => 1234
```