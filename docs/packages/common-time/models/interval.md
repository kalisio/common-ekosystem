---
title: Interval
description: Immutable half-open interval between two date-time instants.
---

# Interval

The `Interval` class represents an immutable half-open time interval `[start, end)`.

The start is included and the end is excluded. Both bounds represent absolute instants associated with the same IANA timezone.

Empty intervals, where `start` equals `end`, are allowed.

## Constructor

### Signature

```js
new Interval(start, end, options)
```

### Description

Creates an interval from two date-time bounds, another `Interval`, a JSON snapshot, or an ISO 8601 interval string.

Each bound may be a `DateTime`, native `Date`, millisecond timestamp, or ISO 8601 date-time string.

When `start` is a `DateTime`, its timezone is inherited. When copying an `Interval` or restoring a snapshot, its timezone is also inherited. Otherwise, the default timezone is `UTC`.

The start must not be after the end.

ISO interval strings must contain two instants separated by `/`. Duration-based interval notation is not supported.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `start` | `DateTime \| Date \| number \| string \| Interval \| object` | yes | Start bound, interval, snapshot, or ISO interval string. |
| `end` | `DateTime \| Date \| number \| string` | conditional | End bound when two bounds are provided. |
| `options` | `object` | no | Construction options. |
| `options.timezone` | `string` | no | IANA timezone, overriding the inherited timezone. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Missing bounds or unsupported input type. |
| `RangeError` | Invalid bounds, timezone, interval format, or start after end. |

### Examples

```js
const interval = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

interval.timezone
// 'UTC'

new Interval(
  '2026-11-20T13:00:00',
  '2026-11-20T15:00:00',
  { timezone: 'Europe/Paris' }
).start.toISOString()
// '2026-11-20T12:00:00.000Z'

new Interval({
  start: '2026-11-20T12:00:00Z',
  end: '2026-11-20T14:00:00Z',
  timezone: 'Europe/Paris'
})
// Interval instance

new Interval(
  '2026-11-20T12:00:00Z/2026-11-20T14:00:00Z'
)
// Interval instance
```

## from

### Signature

```js
Interval.from(value, end, options)
```

### Description

Creates an interval from the supplied value.

When `value` is already an `Interval` and no additional arguments are provided, the existing instance is returned unchanged.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Interval \| object \| string \| DateTime \| Date \| number` | yes | Existing interval, snapshot, ISO interval string, or start bound. |
| `end` | `DateTime \| Date \| number \| string` | no | End bound. |
| `options` | `object` | no | Construction options, including `timezone`. |

### Returns

| Type | Description |
|------|-------------|
| `Interval` | Existing instance or a new interval. |

### Throws

The same exceptions as the constructor.

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

Interval.from(value) === value
// true

Interval.from(
  '2026-11-20T12:00:00Z/2026-11-20T14:00:00Z'
)
// Interval instance
```

## Properties

### start

Returns the inclusive start bound as a `DateTime`.

### end

Returns the exclusive end bound as a `DateTime`.

### timezone

Returns the IANA timezone associated with the interval.

### duration

Returns the exact elapsed duration between the two bounds as a `Duration`.

The elapsed duration is calculated from timestamps, not calendar approximations. For example, an interval covering a local day with a daylight-saving transition may last 23 or 25 hours.

| Property | Type | Description |
|----------|------|-------------|
| `start` | `DateTime` | Inclusive start. |
| `end` | `DateTime` | Exclusive end. |
| `timezone` | `string` | IANA timezone. |
| `duration` | `Duration` | Exact elapsed duration. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z',
  { timezone: 'Europe/Paris' }
)

value.start.toISOString()
// '2026-11-20T12:00:00.000Z'

value.end.toISOString()
// '2026-11-20T14:00:00.000Z'

value.timezone
// 'Europe/Paris'

value.duration.toISOString()
// 'PT2H'
```

All properties are read-only.

## isEmpty

### Signature

```js
interval.isEmpty()
```

### Description

Returns `true` when both bounds represent the same instant.

An empty interval contains no instants and does not overlap another interval.

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the interval is empty. |

### Examples

```js
new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T12:00:00Z'
).isEmpty()
// true

new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
).isEmpty()
// false
```

## contains

### Signature

```js
interval.contains(value)
```

### Description

Returns `true` if the specified instant belongs to the interval.

The start is included and the end is excluded.

Strings without an explicit offset are interpreted in the interval's timezone.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | Instant to test. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the instant belongs to the interval. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported date input type. |
| `RangeError` | Invalid date. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

value.contains('2026-11-20T12:00:00Z')
// true

value.contains('2026-11-20T13:00:00Z')
// true

value.contains('2026-11-20T14:00:00Z')
// false
```

## overlaps

### Signature

```js
interval.overlaps(value)
```

### Description

Returns `true` if the interval shares at least one instant with another interval.

Adjacent intervals are considered disjoint because the end bound is excluded.

Empty intervals never overlap.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Interval \| object \| string` | yes | Interval, snapshot, or ISO interval string to compare. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the intervals overlap. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported interval input. |
| `RangeError` | Invalid interval or bounds. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

value.overlaps(new Interval(
  '2026-11-20T13:00:00Z',
  '2026-11-20T15:00:00Z'
))
// true

value.overlaps(new Interval(
  '2026-11-20T14:00:00Z',
  '2026-11-20T16:00:00Z'
))
// false
```

## intersection

### Signature

```js
interval.intersection(value)
```

### Description

Returns the common portion of two intervals.

If the intervals do not overlap, returns `null`.

The resulting interval preserves the timezone of the current instance.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Interval \| object \| string` | yes | Interval, snapshot, or ISO interval string to intersect. |

### Returns

| Type | Description |
|------|-------------|
| `Interval \| null` | Intersection, or `null` if the intervals are disjoint. |

### Throws

The same exceptions as `overlaps`.

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

const other = new Interval(
  '2026-11-20T13:00:00Z',
  '2026-11-20T15:00:00Z'
)

value.intersection(other).toString()
// '2026-11-20T13:00:00.000Z/2026-11-20T14:00:00.000Z'

value.intersection(new Interval(
  '2026-11-20T14:00:00Z',
  '2026-11-20T16:00:00Z'
))
// null
```

## shift

### Signature

```js
interval.shift(value, unit)
```

### Description

Shifts both bounds by the specified duration and returns a new `Interval`.

The operation uses calendar-aware arithmetic in the interval's timezone.

Time-based durations preserve the elapsed length of the interval. Calendar durations may change its elapsed length because of daylight-saving transitions or month-end clamping.

For example, shifting an interval aligned with a calendar month preserves the month boundaries, while shifting individual days near the end of a month may shorten the interval or make it empty.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Duration \| string \| number` | yes | Duration to shift by. |
| `unit` | `string` | no | Required for numeric amounts. |

### Returns

| Type | Description |
|------|-------------|
| `Interval` | New shifted interval. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported duration input or missing numeric unit. |
| `RangeError` | Invalid duration or shifted interval. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

value.shift('PT1H').toString()
// '2026-11-20T13:00:00.000Z/2026-11-20T15:00:00.000Z'

value.shift(-90, 'minutes').toString()
// '2026-11-20T10:30:00.000Z/2026-11-20T12:30:00.000Z'

const january = new Interval(
  '2026-01-01T00:00:00Z',
  '2026-02-01T00:00:00Z'
)

january.shift('P1M').toString()
// '2026-02-01T00:00:00.000Z/2026-03-01T00:00:00.000Z'
```

## withTimezone

### Signature

```js
interval.withTimezone(name)
```

### Description

Returns a new `Interval` associated with another timezone.

The absolute start and end instants remain unchanged.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Target IANA timezone. |

### Returns

| Type | Description |
|------|-------------|
| `Interval` | Interval associated with the selected timezone. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | Invalid timezone. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

const paris = value.withTimezone('Europe/Paris')

paris.timezone
// 'Europe/Paris'

paris.start.format('HH:mm')
// '13:00'

paris.equals(value)
// true
```

## equals

### Signature

```js
interval.equals(value)
```

### Description

Compares two intervals using their absolute start and end instants.

Timezone differences are ignored.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Interval \| object \| string` | yes | Interval, snapshot, or ISO interval string to compare. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if both intervals have identical bounds. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported interval input. |
| `RangeError` | Invalid interval. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z'
)

value.equals(value.withTimezone('Europe/Paris'))
// true

value.equals(new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T15:00:00Z'
))
// false
```

## toJSON

### Signature

```js
interval.toJSON()
```

### Description

Returns a JSON-compatible snapshot containing both bounds as UTC ISO 8601 strings and the associated timezone.

The snapshot can be restored using `new Interval(snapshot)` or `Interval.from(snapshot)`.

### Returns

| Type | Description |
|------|-------------|
| `object` | Object containing `start`, `end`, and `timezone`. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z',
  { timezone: 'Europe/Paris' }
)

value.toJSON()
// {
//   start: '2026-11-20T12:00:00.000Z',
//   end: '2026-11-20T14:00:00.000Z',
//   timezone: 'Europe/Paris'
// }

Interval.from(JSON.parse(JSON.stringify(value))).equals(value)
// true
```

## toString

### Signature

```js
interval.toString()
```

### Description

Returns an ISO 8601 interval string containing the UTC representations of the two bounds, separated by `/`.

The timezone is not included in this representation. Use `toJSON` to preserve it when serializing the interval.

### Returns

| Type | Description |
|------|-------------|
| `string` | ISO 8601 interval represented as `start/end`. |

### Examples

```js
const value = new Interval(
  '2026-11-20T12:00:00Z',
  '2026-11-20T14:00:00Z',
  { timezone: 'Europe/Paris' }
)

value.toString()
// '2026-11-20T12:00:00.000Z/2026-11-20T14:00:00.000Z'

new Interval(value.toString()).equals(value)
// true
```
