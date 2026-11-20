---
title: Duration
description: Immutable model for representing and manipulating ISO 8601 durations.
---

# Duration

The `Duration` class represents an immutable duration backed by a normalized ISO 8601 string.

It supports calendar units (years, months, weeks, days) and time units (hours, minutes, seconds, milliseconds). Arithmetic returns new instances without modifying the original duration.

## Constructor

### Signature

```js
new Duration(value, unit)
```

### Description

Creates a duration from an ISO 8601 string, a numeric amount with an explicit unit, or another `Duration`.

ISO 8601 representations are normalized using Moment's duration rules. When copying a `Duration`, the unit must be omitted.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| number \| Duration` | yes | ISO 8601 duration, numeric amount, or existing duration. |
| `unit` | `string` | no | Required for numeric amounts; must be omitted otherwise. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported input, missing numeric unit, or a unit provided when copying a `Duration`. |
| `RangeError` | Invalid duration or unit. |

### Examples

```js
new Duration('PT3H')
// Duration representing 3 hours

new Duration(90, 'minutes').toISOString()
// 'PT1H30M'

new Duration('P1D').toISOString()
// 'P1D'

new Duration('-PT3H').toISOString()
// '-PT3H'

const original = new Duration('PT2H')
const copy = new Duration(original)

copy.toISOString()
// 'PT2H'
```

## from

### Signature

```js
Duration.from(value, unit)
```

### Description

Creates a `Duration` from the specified value.

If `value` is already a `Duration` and `unit` is omitted, the existing instance is returned unchanged.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| number \| Duration` | yes | Duration to convert. |
| `unit` | `string` | no | Required for numeric amounts. |

### Returns

| Type | Description |
|------|-------------|
| `Duration` | The existing instance or a new duration. |

### Throws

The same exceptions as the constructor.

### Examples

```js
Duration.from('PT30M').toISOString()
// 'PT30M'

Duration.from(2, 'hours').toISOString()
// 'PT2H'

const value = new Duration('PT1H')

Duration.from(value) === value
// true
```

## add

### Signature

```js
duration.add(value, unit)
```

### Description

Adds another duration and returns a new `Duration`.

Calendar components are preserved according to Moment's normalization rules. The original instance is not modified.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| number \| Duration` | yes | Duration to add. |
| `unit` | `string` | no | Required for numeric amounts. |

### Returns

| Type | Description |
|------|-------------|
| `Duration` | The resulting duration. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported input or missing numeric unit. |
| `RangeError` | Invalid duration or unit. |

### Examples

```js
new Duration('PT1H').add('PT30M').toISOString()
// 'PT1H30M'

new Duration('PT1H').add(30, 'minutes').toISOString()
// 'PT1H30M'

new Duration('P1M').add('P2D').toISOString()
// 'P1M2D'
```

## subtract

### Signature

```js
duration.subtract(value, unit)
```

### Description

Subtracts another duration and returns a new `Duration`.

The original instance is not modified.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| number \| Duration` | yes | Duration to subtract. |
| `unit` | `string` | no | Required for numeric amounts. |

### Returns

| Type | Description |
|------|-------------|
| `Duration` | The resulting duration. |

### Throws

The same exceptions as `add`.

### Examples

```js
new Duration('PT2H').subtract('PT30M').toISOString()
// 'PT1H30M'

new Duration('PT1H').subtract(2, 'hours').toISOString()
// '-PT1H'

new Duration('P1D').subtract('P1D').toISOString()
// 'P0D'
```

## negate

### Signature

```js
duration.negate()
```

### Description

Returns a new `Duration` with the opposite sign.

### Returns

| Type | Description |
|------|-------------|
| `Duration` | The negated duration. |

### Examples

```js
new Duration('PT3H').negate().toISOString()
// '-PT3H'

new Duration('-PT1H').negate().toISOString()
// 'PT1H'
```

## equals

### Signature

```js
duration.equals(value, unit)
```

### Description

Compares durations using their normalized ISO 8601 representations.

Equivalent normalized representations are equal, but calendar durations are not treated as equivalent to fixed elapsed durations.

For example, `PT60M` equals `PT1H`, while `P1D` does not equal `PT24H`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| number \| Duration` | yes | Duration to compare. |
| `unit` | `string` | no | Required for numeric amounts. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if both normalized representations are equal. |

### Throws

The same exceptions as the constructor for invalid comparison values.

### Examples

```js
new Duration('PT1H').equals('PT60M')
// true

new Duration('PT1H').equals(60, 'minutes')
// true

new Duration('P1D').equals('PT24H')
// false

new Duration('PT1H').equals('PT2H')
// false
```

## asMilliseconds

### Signature

```js
duration.asMilliseconds()
```

### Description

Returns the duration in milliseconds.

Only time-based durations can be converted. Nonzero calendar components require a reference date and are therefore rejected.

### Returns

| Type | Description |
|------|-------------|
| `number` | Duration in milliseconds. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | The duration contains calendar components that cannot be converted without a reference date. |

### Examples

```js
new Duration('PT3H').asMilliseconds()
// 10800000

new Duration('PT1.5S').asMilliseconds()
// 1500

new Duration('-PT30M').asMilliseconds()
// -1800000

new Duration('P1D').asMilliseconds()
// RangeError
```

## toISOString

### Signature

```js
duration.toISOString()
```

### Description

Returns the normalized ISO 8601 representation of the duration.

### Returns

| Type | Description |
|------|-------------|
| `string` | Normalized ISO 8601 duration. |

### Examples

```js
new Duration('PT90M').toISOString()
// 'PT1H30M'

new Duration('P1W').toISOString()
// 'P7D'

new Duration('PT0S').toISOString()
// 'P0D'
```

## toString

### Signature

```js
duration.toString()
```

### Description

Returns the same normalized ISO 8601 string as `toISOString`.

### Returns

| Type | Description |
|------|-------------|
| `string` | Normalized ISO 8601 duration. |

### Examples

```js
const value = new Duration('PT2H')

value.toString()
// 'PT2H'

String(value)
// 'PT2H'
```

## toJSON

### Signature

```js
duration.toJSON()
```

### Description

Returns the normalized ISO 8601 string used when serializing the duration to JSON.

A serialized duration can be restored using the constructor or `Duration.from`.

### Returns

| Type | Description |
|------|-------------|
| `string` | Normalized ISO 8601 duration. |

### Examples

```js
const value = new Duration('PT2H')

JSON.stringify(value)
// '"PT2H"'

Duration.from(JSON.parse(JSON.stringify(value))).equals(value)
// true
```
