
---
title: cast
description: Strict type conversion utilities with fallback support.
---

# cast

Utility functions for converting values to primitive types, dates and collections.

Conversions are restricted to explicitly supported input types. When a value cannot be converted, the optional `fallback` is returned unchanged (`undefined` by default).

If a value already has the requested type, it is returned as-is, preserving its reference for objects and collections.

## number

Converts a value to a finite number.

### Signature

```js
cast.number(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A finite `number`, or the fallback.

Accepts finite numbers and decimal strings, including signed values and scientific notation.

Rejects empty strings, hexadecimal, binary and octal notation, numeric separators, `Infinity`, `NaN` and partially numeric strings.

Overflow is rejected. Underflow may round to zero.

### Examples

```js
cast.number('42')
// 42

cast.number(' -1.5 ')
// -1.5

cast.number('1e3')
// 1000

cast.number('.5')
// 0.5

cast.number('42px')
// undefined

cast.number('0x10')
// undefined

cast.number('invalid', 0)
// 0
```

## integer

Converts a value to a safe integer.

### Signature

```js
cast.integer(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A safe integer, or the fallback.

Uses the same numeric conversion rules as `cast.number()`, then checks whether the result is a safe integer.

Fractional values are not truncated. Validation takes place after JavaScript number conversion, so floating-point rounding may affect the result.

### Examples

```js
cast.integer('42')
// 42

cast.integer('42.0')
// 42

cast.integer('1e3')
// 1000

cast.integer('1.5')
// undefined

cast.integer('9007199254740992')
// undefined

cast.integer('invalid', 0)
// 0
```

## boolean

Converts a value to a boolean.

### Signature

```js
cast.boolean(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A `boolean`, or the fallback.

Accepts booleans, numeric `0` and `1`, and the following case-insensitive strings after trimming:

| True | False |
|---|---|
| `true` | `false` |
| `1` | `0` |
| `yes` | `no` |
| `on` | `off` |

Other values are rejected rather than converted using JavaScript truthiness.

### Examples

```js
cast.boolean('true')
// true

cast.boolean(' YES ')
// true

cast.boolean(1)
// true

cast.boolean('off')
// false

cast.boolean(0)
// false

cast.boolean('maybe')
// undefined

cast.boolean(2, false)
// false
```

## string

Converts a value to a string.

### Signature

```js
cast.string(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A `string`, or the fallback.

Accepts strings, finite numbers and booleans.

Does not implicitly stringify objects, arrays, dates, symbols, bigints, `null` or `undefined`.

### Examples

```js
cast.string(42)
// '42'

cast.string(true)
// 'true'

cast.string(false)
// 'false'

cast.string('hello')
// 'hello'

cast.string(null)
// undefined

cast.string({ a: 1 })
// undefined

cast.string(null, '')
// ''
```

## date

Converts a value to a valid native JavaScript `Date`.

### Signature

```js
cast.date(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A valid `Date` instance, or the fallback.

Accepts:

- Valid `Date` instances, returned unchanged.
- Safe integer timestamps in milliseconds since the Unix epoch.
- ISO date strings in `YYYY-MM-DD` format, interpreted as UTC.
- ISO date-time strings with an explicit timezone (`Z` or `±HH:mm`).

Date-time strings may include hours and minutes, optional seconds and optional milliseconds (exactly three digits).

Date-time strings without an explicit timezone are rejected. Invalid calendar dates are also rejected.

Parsing uses the native `Date` constructor after format and calendar-day validation.

### Examples

```js
cast.date('2026-11-01')
// Date representing 2026-11-01T00:00:00.000Z

cast.date('2026-11-01T14:30:00Z')
// Date representing 2026-11-01T14:30:00.000Z

cast.date('2026-11-01T14:30:00+01:00')
// Date representing 2026-11-01T13:30:00.000Z

cast.date(0)
// Date representing 1970-01-01T00:00:00.000Z

cast.date('2026-11-01T14:30:00')
// undefined

cast.date('2026-02-30')
// undefined

cast.date('invalid', new Date(0))
// Date representing 1970-01-01T00:00:00.000Z
```

## array

Converts a value to an array.

### Signature

```js
cast.array(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

An `Array`, or the fallback.

Accepts arrays, sets and maps.

- Arrays are returned unchanged.
- Sets are converted to arrays of values.
- Maps are converted to arrays of `[key, value]` entries.

### Examples

```js
cast.array([1, 2])
// [1, 2]

cast.array(new Set([1, 2]))
// [1, 2]

cast.array(new Map([['a', 1], ['b', 2]]))
// [['a', 1], ['b', 2]]

cast.array('abc')
// undefined

cast.array('invalid', [])
// []
```

## object

Converts a value to a plain object.

### Signature

```js
cast.object(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A plain object, or the fallback.

Accepts plain objects and maps whose keys are all strings.

- Plain objects are returned unchanged.
- Maps are converted using `Object.fromEntries()`.
- Maps containing non-string keys are rejected.

Map insertion order is not necessarily preserved when represented as object property enumeration order, especially for integer-index keys.

A `__proto__` key is retained as an own data property. Operations that subsequently merge or assign the object must handle prototype pollution safely.

### Examples

```js
cast.object({ a: 1 })
// { a: 1 }

cast.object(new Map([['a', 1], ['b', 2]]))
// { a: 1, b: 2 }

cast.object(new Map([[1, 'one']]))
// undefined

cast.object([['a', 1]])
// undefined

cast.object(null, {})
// {}
```

## map

Converts a value to a `Map`.

### Signature

```js
cast.map(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A `Map`, or the fallback.

Accepts maps, plain objects and arrays of key-value pairs.

- Maps are returned unchanged.
- Plain objects are converted using their own enumerable string-keyed properties.
- Objects containing own symbol-keyed properties are rejected, including non-enumerable symbols.
- Non-enumerable string-keyed properties are ignored.
- Arrays must contain only pairs of exactly two elements.
- Duplicate keys in arrays are rejected.

### Examples

```js
cast.map({ a: 1, b: 2 })
// Map { 'a' => 1, 'b' => 2 }

cast.map([['a', 1], ['b', 2]])
// Map { 'a' => 1, 'b' => 2 }

cast.map([['a', 1], ['a', 2]])
// undefined

cast.map([['a']])
// undefined

cast.map({ [Symbol('key')]: 1 })
// undefined

cast.map('invalid', new Map())
// Empty Map
```

## set

Converts a value to a `Set`.

### Signature

```js
cast.set(value, fallback)
```

### Parameters

- `value` — Value to convert.
- `fallback` — Optional value returned when conversion fails. Defaults to `undefined`.

### Returns

A `Set`, or the fallback.

Accepts sets and arrays.

- Sets are returned unchanged.
- Arrays are converted to sets.
- Duplicate array values are removed according to JavaScript `Set` equality semantics.

### Examples

```js
cast.set([1, 2, 3])
// Set { 1, 2, 3 }

cast.set([1, 2, 2, 3])
// Set { 1, 2, 3 }

cast.set(new Set([1, 2]))
// Same Set instance

cast.set('abc')
// undefined

cast.set('invalid', new Set())
// Empty Set
```
