---
title: duration
description: Utility functions for parsing, normalizing, and manipulating ISO 8601 durations.
---

# duration

Utility functions for parsing, validating, normalizing, and manipulating ISO 8601 durations.

Durations are represented as ISO 8601 strings. Calculations are based on `moment-timezone`, but Moment instances are never exposed.

Calendar units (years, months, weeks, and days) are distinguished from time units (hours, minutes, seconds, and milliseconds). Calendar durations cannot be converted directly into milliseconds without a reference date.

```js
import { duration } from '@kalisio/common-time'
```

## parse

### Signature

```js
duration.parse(value, unit)
```

### Description

Parses a duration and returns its normalized ISO 8601 representation.

Accepts either an ISO 8601 duration string or a finite number with an explicit unit.

Normalization follows Moment's rules:

- Weeks are converted into days.
- Months are carried over into years.
- Seconds and minutes are carried over into larger time units, up to hours.
- Hours are never converted into days.
- Zero durations are represented as `P0D`.
- Fractional seconds are rounded to millisecond precision.

ISO 8601 designators are case-insensitive. Signed durations and individually signed components are supported, including Moment extensions such as `P1M-1D`.

Normalization can lose distinctions between calendar and time components when their nominal totals cancel. For example, `P1DT-24H` becomes `P0D`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| number` | yes | An ISO 8601 duration or a finite numeric amount. |
| `unit` | `string` | no | Unit required for numeric amounts. Must be omitted for ISO duration strings. |

Supported numeric units: `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second`, and `millisecond`. Singular, plural, and supported Moment aliases are accepted.

### Returns

| Type | Description |
|------|-------------|
| `string` | The normalized ISO 8601 duration. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The input type is unsupported, the numeric amount is not finite, or the unit is missing or unexpectedly provided. |
| `RangeError` | The ISO 8601 duration or the unit is invalid. |

### Examples

```js
duration.parse('PT90M')
// 'PT1H30M'

duration.parse('P1W')
// 'P7D'

duration.parse('P13M')
// 'P1Y1M'

duration.parse('PT36H')
// 'PT36H'

duration.parse('PT-3H')
// '-PT3H'

duration.parse('PT0S')
// 'P0D'

duration.parse(90, 'minutes')
// 'PT1H30M'

duration.parse(1, 'day')
// 'P1D'

duration.parse(24, 'hours')
// 'PT24H'

duration.parse(1500, 'ms')
// 'PT1.5S'

duration.parse('invalid')
// RangeError
```

## add

### Signature

```js
duration.add(left, right)
```

### Description

Adds two ISO 8601 durations and returns a normalized ISO 8601 string.

Calendar components are preserved rather than converted into fixed amounts of milliseconds. The resulting duration follows Moment's normalization rules.

Both arguments must be ISO 8601 duration strings.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `left` | `string` | yes | First ISO 8601 duration. |
| `right` | `string` | yes | Second ISO 8601 duration. |

### Returns

| Type | Description |
|------|-------------|
| `string` | The normalized sum of the two durations. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | An argument is not an ISO 8601 duration string. |
| `RangeError` | A duration is invalid. |

### Examples

```js
duration.add('PT45M', 'PT30M')
// 'PT1H15M'

duration.add('PT23H', 'PT2H')
// 'PT25H'

duration.add('P1M', 'P1D')
// 'P1M1D'

duration.add('P1Y', 'P6M')
// 'P1Y6M'

duration.add('PT1H', '-PT1H')
// 'P0D'
```

## subtract

### Signature

```js
duration.subtract(left, right)
```

### Description

Subtracts the second ISO 8601 duration from the first and returns a normalized ISO 8601 string.

Calendar units are preserved. When the result contains calendar components of opposite signs, Moment's extended ISO representation may be returned.

Both arguments must be ISO 8601 duration strings.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `left` | `string` | yes | Duration from which to subtract. |
| `right` | `string` | yes | Duration to subtract. |

### Returns

| Type | Description |
|------|-------------|
| `string` | The normalized difference between the durations. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | An argument is not an ISO 8601 duration string. |
| `RangeError` | A duration is invalid. |

### Examples

```js
duration.subtract('PT2H', 'PT30M')
// 'PT1H30M'

duration.subtract('PT1H', 'PT2H')
// '-PT1H'

duration.subtract('PT1H', '-PT30M')
// 'PT1H30M'

duration.subtract('P1M', 'P1D')
// 'P1M-1D'

duration.subtract('P1D', 'P1D')
// 'P0D'
```

## asMilliseconds

### Signature

```js
duration.asMilliseconds(value, unit)
```

### Description

Converts a time-based duration into milliseconds.

Accepts an ISO 8601 duration string or a finite number with an explicit unit.

Durations containing nonzero calendar components (years, months, weeks, or days) are rejected because their elapsed length may depend on a reference date and timezone.

Zero-valued calendar components are accepted. Calendar components are checked before normalization, so a duration such as `P1DT-24H` is rejected even though Moment normalizes it to `P0D`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string \| number` | yes | An ISO 8601 duration or finite numeric amount. |
| `unit` | `string` | no | Unit required for numeric amounts. Must be omitted for ISO duration strings. |

### Returns

| Type | Description |
|------|-------------|
| `number` | Duration in milliseconds. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The input has an unsupported type or an invalid numeric amount. |
| `RangeError` | The duration or unit is invalid, or the duration contains nonzero calendar components. |

### Examples

```js
duration.asMilliseconds('PT3H')
// 10800000

duration.asMilliseconds('PT1M30S')
// 90000

duration.asMilliseconds('PT1.5S')
// 1500

duration.asMilliseconds('-PT1H')
// -3600000

duration.asMilliseconds(90, 'minutes')
// 5400000

duration.asMilliseconds('P0D')
// 0

duration.asMilliseconds('P1D')
// RangeError

duration.asMilliseconds('P1DT-24H')
// RangeError
```

## isValid

### Signature

```js
duration.isValid(value, unit)
```

### Description

Returns `true` if the supplied value can be parsed as a duration.

Accepts the same inputs as `parse`, including ISO 8601 duration strings and finite numeric amounts with an explicit unit.

Returns `false` instead of throwing for invalid inputs.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `any` | yes | The value to validate. |
| `unit` | `string` | no | Unit for a numeric amount. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the duration is valid, `false` otherwise. |

### Examples

```js
duration.isValid('P1D')
// true

duration.isValid('PT3H')
// true

duration.isValid('pt1h')
// true

duration.isValid(90, 'minutes')
// true

duration.isValid('P1H')
// false

duration.isValid('PT')
// false

duration.isValid(5)
// false

duration.isValid(null)
// false
```
