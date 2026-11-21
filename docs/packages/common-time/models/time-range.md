---
title: TimeRange
description: Immutable half-open time range between two date-time instants.
---

# TimeRange

`TimeRange` represents an immutable half-open time range `[start, end)`: the start is included and the end is excluded. Both bounds are `DateTime` instances using the same timezone. Empty ranges are allowed.

```js
import { TimeRange } from '@kalisio/common-time'
```

## Constructor

### Signature

```js
new TimeRange(start, end, options)
```

### Description

Creates a range from two instants, another `TimeRange`, a JSON snapshot, or an ISO 8601 `start/end` string. Bounds may be `DateTime`, native `Date`, millisecond timestamps, or date-time strings. The timezone is inherited from a `DateTime` start, copied range, or snapshot; otherwise it defaults to `UTC`. `options.timezone` overrides it.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `start` | `DateTime \| Date \| number \| string \| TimeRange \| object` | yes | Start instant, existing range, JSON snapshot, or ISO interval string. |
| `end` | `DateTime \| Date \| number \| string` | conditional | End instant when passing two bounds. |
| `options` | `object` | no | Construction options. |
| `options.timezone` | `string` | no | IANA timezone, overriding any inherited timezone. |

### Returns

| Type | Description |
|------|-------------|
| `TimeRange` | New immutable range. |

### Throws

`TypeError` for missing bounds or unsupported inputs; `RangeError` for invalid dates, timezone, ISO format, or start after end.

### Examples

```js
const range = new TimeRange('2026-11-20T12:00:00Z', '2026-11-20T14:00:00Z')
range.toString()
// '2026-11-20T12:00:00.000Z/2026-11-20T14:00:00.000Z'

new TimeRange({
  start: '2026-11-20T12:00:00Z',
  end: '2026-11-20T14:00:00Z',
  timezone: 'Europe/Paris'
})

new TimeRange('2026-11-20T12:00:00Z/2026-11-20T14:00:00Z')
```

Only ISO 8601 intervals containing **two instants** are accepted; `start/duration` and `duration/end` are not supported.

## from

### Signature

```js
TimeRange.from(value, end, options)
```

### Description

Creates a range from the same inputs as the constructor. Returns an existing `TimeRange` unchanged when no additional arguments are supplied.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `TimeRange \| object \| string \| DateTime \| Date \| number` | yes | Range, snapshot, ISO interval, or start instant. |
| `end` | `DateTime \| Date \| number \| string` | no | Optional end instant. |
| `options` | `object` | no | Construction options, including `timezone`. |

### Returns

| Type | Description |
|------|-------------|
| `TimeRange` | Existing instance or a new range. |

### Examples

```js
TimeRange.from(range) === range // true
TimeRange.from('2026-11-20T12:00:00Z', '2026-11-20T14:00:00Z')
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `start` | `DateTime` | Inclusive start bound. |
| `end` | `DateTime` | Exclusive end bound. |
| `timezone` | `string` | IANA timezone associated with both bounds. |
| `duration` | `Duration` | Exact elapsed duration calculated from timestamps. |

All properties are read-only. The object is frozen; operations return new instances rather than modifying it. Calendar-day ranges crossing daylight saving changes can last 23 or 25 hours.

```js
range.duration.toISOString() // 'PT2H'
range.start.toISOString()     // '2026-11-20T12:00:00.000Z'
```

## isEmpty

### Signature

```js
range.isEmpty()
```

### Description

Returns `true` if both bounds represent the same instant. An empty range contains no instants and overlaps no range.

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether the range is empty. |

### Examples

```js
new TimeRange(1000, 1000).isEmpty() // true
```

## contains

### Signature

```js
range.contains(value)
```

### Description

Checks whether an instant belongs to `[start, end)`. Strings without an explicit offset are interpreted in the range's timezone.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | Instant to test. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the instant is within the range. |

### Examples

```js
range.contains('2026-11-20T12:00:00Z') // true
range.contains('2026-11-20T14:00:00Z') // false
```

## overlaps

### Signature

```js
range.overlaps(value)
```

### Description

Checks for a nonempty intersection with another range. Adjacent and empty ranges do not overlap.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `TimeRange \| object \| string` | yes | Range, snapshot, or ISO interval string. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | Whether the ranges overlap. |

### Examples

```js
range.overlaps(new TimeRange('2026-11-20T13:00:00Z', '2026-11-20T15:00:00Z')) // true
```

## intersection

### Signature

```js
range.intersection(value)
```

### Description

Returns the common range using the receiver's timezone, or `null` when there is no overlap.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `TimeRange \| object \| string` | yes | Other range. |

### Returns

| Type | Description |
|------|-------------|
| `TimeRange \| null` | Intersection or `null`. |

### Examples

```js
range.intersection(new TimeRange('2026-11-20T13:00:00Z', '2026-11-20T15:00:00Z')).toString()
// '2026-11-20T13:00:00.000Z/2026-11-20T14:00:00.000Z'
```

## shift

### Signature

```js
range.shift(value, unit)
```

### Description

Shifts both bounds by a `Duration` without modifying the original range. Fixed time-based durations preserve elapsed length. Calendar durations use local-time arithmetic, so month-end clamping or daylight saving transitions can change the elapsed duration or produce an empty range.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Duration \| string \| number` | yes | Duration or numerical amount (with `unit`). |
| `unit` | `string` | conditional | Unit for a numerical amount. |

### Returns

| Type | Description |
|------|-------------|
| `TimeRange` | Shifted range. |

### Examples

```js
const shifted = range.shift('PT1H')
shifted.toString()
// '2026-11-20T13:00:00.000Z/2026-11-20T15:00:00.000Z'
range.shift(-90, 'minutes')
```

## withTimezone

### Signature

```js
range.withTimezone(name)
```

### Description

Returns a new range representing the same absolute bounds in another IANA timezone.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Target IANA timezone. |

### Returns

| Type | Description |
|------|-------------|
| `TimeRange` | Range in the target timezone. |

### Examples

```js
range.withTimezone('Europe/Paris').start.toISOString()
// '2026-11-20T12:00:00.000Z'
```

## equals

### Signature

```js
range.equals(value)
```

### Description

Compares absolute start and end timestamps, independently of timezone.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `TimeRange \| object \| string` | yes | Range to compare. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` for equal bounds. |

### Examples

```js
range.equals(range.withTimezone('Asia/Tokyo')) // true
```

## Serialization

### Signatures

```js
range.toJSON()
range.toString()
```

### Description

`toJSON()` returns `{ start, end, timezone }` with ISO timestamps. `toString()` returns the ISO 8601 `start/end` notation in UTC; the original timezone is not encoded in that string.

### Returns

| Method | Type | Description |
|--------|------|-------------|
| `toJSON()` | `object` | Serializable snapshot. |
| `toString()` | `string` | ISO 8601 interval string. |

### Examples

```js
JSON.stringify(range)
// '{"start":"2026-11-20T12:00:00.000Z","end":"2026-11-20T14:00:00.000Z","timezone":"UTC"}'
TimeRange.from(JSON.parse(JSON.stringify(range))).equals(range) // true
```
