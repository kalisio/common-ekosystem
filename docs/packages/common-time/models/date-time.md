---
title: DateTime
description: Immutable date-time model with IANA timezone support.
---

# DateTime

The `DateTime` class represents an immutable instant associated with an IANA timezone.

The underlying instant is stored as a Unix timestamp in milliseconds. The timezone determines how dates are formatted and how calendar operations are performed.

Operations that change the instant or timezone return a new instance.

```js
import { DateTime } from '@kalisio/common-time'
```

## Constructor

### Signature

```js
new DateTime(value, options)
```

### Description

Creates a `DateTime` from a native `Date`, a millisecond timestamp, an ISO 8601 string, another `DateTime`, or a JSON snapshot.

When `value` is omitted, the current time is used.

The default timezone is `UTC`. When copying a `DateTime` or restoring a snapshot, the original timezone is inherited unless explicitly overridden.

Strings without an explicit offset are interpreted in the selected timezone. Strings with an explicit offset represent an absolute instant.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string \| DateTime \| object` | no | Date value or snapshot. Defaults to the current time. |
| `options` | `object` | no | Construction options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC` or the inherited timezone. |
| `options.format` | `string` | no | Custom Moment parsing format for date strings. Locale-sensitive tokens follow the [date.parse](../utilities/date.md#parse) rules. |
| `options.locale` | `string` | no | Loaded Moment locale used by locale-sensitive format tokens. Defaults to `en`. |

A JSON snapshot has the following structure:

```js
{
  instant: '2026-11-20T12:00:00.000Z',
  timezone: 'Europe/Paris'
}
```

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported input type or invalid format option. |
| `RangeError` | Invalid date or timezone. |

### Examples

```js
new DateTime('2026-11-20T12:00:00Z').timezone
// 'UTC'

new DateTime('2026-11-20T13:00:00', {
  timezone: 'Europe/Paris'
}).toISOString()
// '2026-11-20T12:00:00.000Z'

new DateTime(new Date('2026-11-20T12:00:00Z'))
// DateTime instance

new DateTime(0).toISOString()
// '1970-01-01T00:00:00.000Z'

new DateTime({
  instant: '2026-11-20T12:00:00.000Z',
  timezone: 'Europe/Paris'
}).timezone
// 'Europe/Paris'
```

## from

### Signature

```js
DateTime.from(value, options)
```

### Description

Creates a `DateTime` from the specified value. Omitting the value uses the current instant.

If `value` is already a `DateTime` and `options` is omitted, the existing instance is returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string \| DateTime \| object` | no | Date value or snapshot. Defaults to the current instant. |
| `options` | `object` | no | Same options as the constructor. |

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | Existing instance or a new `DateTime`. |

### Throws

The same exceptions as the constructor.

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z')

DateTime.from(value) === value
// true

DateTime.from(value, { timezone: 'Europe/Paris' }).timezone
// 'Europe/Paris'
```

## now

### Signature

```js
DateTime.now(options)
```

### Description

Creates a `DateTime` representing the current instant.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | no | Construction options, including `timezone`. |

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | Current date and time. |

### Examples

```js
DateTime.now()
// Current instant in UTC

DateTime.now({ timezone: 'Europe/Paris' })
// Current instant associated with Europe/Paris
```

## Properties

### timestamp

Unix timestamp in milliseconds since the epoch.

| Type | Description |
|------|-------------|
| `number` | Absolute timestamp in milliseconds. |

### timezone

IANA timezone associated with the instance.

| Type | Description |
|------|-------------|
| `string` | Normalized timezone name. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z', {
  timezone: 'Europe/Paris'
})

value.timestamp
// 1795176000000

value.timezone
// 'Europe/Paris'
```

Both properties are read-only.

## withTimezone

### Signature

```js
dateTime.withTimezone(name)
```

### Description

Returns a new `DateTime` associated with another timezone.

The absolute instant remains unchanged. Only its timezone representation changes.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | Target IANA timezone. |

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | New instance with the selected timezone. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | Invalid timezone. |

### Examples

```js
const utc = new DateTime('2026-11-20T12:00:00Z')
const paris = utc.withTimezone('Europe/Paris')

paris.format('HH:mm')
// '13:00'

paris.toISOString() === utc.toISOString()
// true
```

## add

### Signature

```js
dateTime.add(value, unit)
```

### Description

Adds a duration to the date and returns a new `DateTime`.

Accepts a `Duration`, an ISO 8601 duration string, or a numeric amount with an explicit unit.

Calendar operations use the instance's timezone and account for month lengths and daylight-saving transitions.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Duration \| string \| number` | yes | Duration to add. |
| `unit` | `string` | no | Required for numeric amounts. |

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | New date with the duration added. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Invalid duration input type or missing numeric unit. |
| `RangeError` | Invalid duration or unit. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z')

value.add('PT3H').toISOString()
// '2026-11-20T15:00:00.000Z'

value.add(2, 'days').toISOString()
// '2026-11-22T12:00:00.000Z'

value.add(new Duration('PT30M')).toISOString()
// '2026-11-20T12:30:00.000Z'
```

## subtract

### Signature

```js
dateTime.subtract(value, unit)
```

### Description

Subtracts a duration and returns a new `DateTime`.

Uses the same duration and timezone rules as `add`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Duration \| string \| number` | yes | Duration to subtract. |
| `unit` | `string` | no | Required for numeric amounts. |

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | New date with the duration subtracted. |

### Throws

The same exceptions as `add`.

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z')

value.subtract('PT3H').toISOString()
// '2026-11-20T09:00:00.000Z'

value.subtract(1, 'day').toISOString()
// '2026-11-19T12:00:00.000Z'
```

## startOf

### Signature

```js
dateTime.startOf(unit, options)
```

### Description

Returns the beginning of the period containing the current instant.

Period boundaries are calculated in the instance's timezone.

The first day of a `week` depends on the locale. Use `isoWeek` to start weeks on Monday.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `unit` | `string` | yes | Calendar or time unit. |
| `options` | `object` | no | Calculation options. |
| `options.locale` | `string` | no | Loaded Moment locale. Defaults to `en`. |

Supported units: `year`, `quarter`, `month`, `week`, `isoWeek`, `day`, `date`, `hour`, `minute`, `second`, and `millisecond`.

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | Beginning of the selected period. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | Invalid unit or unloaded locale. |

### Examples

```js
const value = new DateTime('2026-11-20T12:30:45Z')

value.startOf('day').toISOString()
// '2026-11-20T00:00:00.000Z'

value.startOf('month').toISOString()
// '2026-11-01T00:00:00.000Z'

value.startOf('isoWeek').toISOString()
// '2026-11-16T00:00:00.000Z'
```

## endOf

### Signature

```js
dateTime.endOf(unit, options)
```

### Description

Returns the last millisecond of the period containing the current instant.

Uses the same units and locale rules as `startOf`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `unit` | `string` | yes | Calendar or time unit. |
| `options` | `object` | no | Calculation options. |
| `options.locale` | `string` | no | Loaded Moment locale. Defaults to `en`. |

### Returns

| Type | Description |
|------|-------------|
| `DateTime` | Last millisecond of the selected period. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | Invalid unit or unloaded locale. |

### Examples

```js
const value = new DateTime('2026-11-20T12:30:45Z')

value.endOf('day').toISOString()
// '2026-11-20T23:59:59.999Z'

value.endOf('month').toISOString()
// '2026-11-30T23:59:59.999Z'
```

## diff

### Signature

```js
dateTime.diff(value, unit, options)
```

### Description

Returns the signed difference between this instance and another date, calculated as `dateTime - value`.

The result is expressed in the specified unit, milliseconds by default.

Fractional differences are truncated toward zero unless `floating` is `true`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | Date to compare. |
| `unit` | `string` | no | Difference unit. Defaults to `milliseconds`. |
| `options` | `object` | no | Calculation options. |
| `options.floating` | `boolean` | no | Preserve fractional results. Defaults to `false`. |

Supported units: `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second`, and `millisecond`.

### Returns

| Type | Description |
|------|-------------|
| `number` | Signed difference in the selected unit. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Unsupported date input. |
| `RangeError` | Invalid date or unit. |

### Examples

```js
const value = new DateTime('2026-11-20T13:30:00Z')

value.diff('2026-11-20T12:00:00Z')
// 5400000

value.diff('2026-11-20T12:00:00Z', 'minutes')
// 90

value.diff('2026-11-20T12:00:00Z', 'hours')
// 1

value.diff('2026-11-20T12:00:00Z', 'hours', {
  floating: true
})
// 1.5
```

## isBefore

### Signature

```js
dateTime.isBefore(value)
```

### Description

Returns `true` if this instance represents an instant strictly before the specified date.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | Date to compare. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the instance is before the specified date. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z')

value.isBefore('2026-11-20T13:00:00Z')
// true

value.isBefore('2026-11-20T12:00:00Z')
// false
```

## isAfter

### Signature

```js
dateTime.isAfter(value)
```

### Description

Returns `true` if this instance represents an instant strictly after the specified date.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | Date to compare. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the instance is after the specified date. |

### Examples

```js
const value = new DateTime('2026-11-20T13:00:00Z')

value.isAfter('2026-11-20T12:00:00Z')
// true

value.isAfter('2026-11-20T13:00:00Z')
// false
```

## isSame

### Signature

```js
dateTime.isSame(value)
```

### Description

Returns `true` if both dates represent exactly the same instant, regardless of their timezones.

Comparison uses millisecond precision.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string \| object` | yes | Date to compare. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if both dates represent the same instant. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z')

value.isSame('2026-11-20T13:00:00+01:00')
// true

value.isSame('2026-11-20T12:00:01Z')
// false
```

## format

### Signature

```js
dateTime.format(pattern, options)
```

### Description

Formats the instant using Moment formatting tokens, the instance's timezone, and the selected locale.

The default format is `YYYY-MM-DDTHH:mm:ss.SSSZ`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pattern` | `string` | no | Moment formatting pattern. |
| `options` | `object` | no | Formatting options. |
| `options.locale` | `string` | no | Loaded Moment locale. Defaults to `en`. |

### Returns

| Type | Description |
|------|-------------|
| `string` | Formatted date and time. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | Invalid formatting pattern. |
| `RangeError` | Unknown or unloaded locale. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z', {
  timezone: 'Europe/Paris'
})

value.format('YYYY-MM-DD HH:mm')
// '2026-11-20 13:00'

value.format('HH:mm z')
// '13:00 CET'

value.format()
// '2026-11-20T13:00:00.000+01:00'
```

## toDate

### Signature

```js
dateTime.toDate()
```

### Description

Returns a new native JavaScript `Date` representing the same instant.

Modifying the returned `Date` does not affect the `DateTime` instance.

### Returns

| Type | Description |
|------|-------------|
| `Date` | New native JavaScript date. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z')

value.toDate().toISOString()
// '2026-11-20T12:00:00.000Z'
```

## toISOString

### Signature

```js
dateTime.toISOString()
```

### Description

Returns the instant in UTC using the standard ISO 8601 representation with millisecond precision.

The result is independent of the instance's timezone.

### Returns

| Type | Description |
|------|-------------|
| `string` | UTC ISO 8601 date-time string. |

### Examples

```js
new DateTime('2026-11-20T13:00:00', {
  timezone: 'Europe/Paris'
}).toISOString()
// '2026-11-20T12:00:00.000Z'
```

## valueOf

### Signature

```js
dateTime.valueOf()
```

### Description

Returns the Unix timestamp in milliseconds.

The model also supports numeric coercion through `Symbol.toPrimitive`, allowing arithmetic and numeric comparisons.

### Returns

| Type | Description |
|------|-------------|
| `number` | Timestamp in milliseconds. |

### Examples

```js
const value = new DateTime('1970-01-01T00:00:01Z')

value.valueOf()
// 1000

+value
// 1000

value > new DateTime(0)
// true
```

## toString

### Signature

```js
dateTime.toString()
```

### Description

Returns the formatted date using the default pattern and the instance's timezone.

Equivalent to `dateTime.format()`.

### Returns

| Type | Description |
|------|-------------|
| `string` | Formatted date-time string. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z', {
  timezone: 'Europe/Paris'
})

value.toString()
// '2026-11-20T13:00:00.000+01:00'

String(value)
// '2026-11-20T13:00:00.000+01:00'
```

## toJSON

### Signature

```js
dateTime.toJSON()
```

### Description

Returns a JSON-compatible snapshot containing the UTC instant and the associated timezone.

The snapshot can be restored using the constructor or `DateTime.from`.

### Returns

| Type | Description |
|------|-------------|
| `object` | Object containing `instant` and `timezone`. |

### Examples

```js
const value = new DateTime('2026-11-20T12:00:00Z', {
  timezone: 'Europe/Paris'
})

value.toJSON()
// {
//   instant: '2026-11-20T12:00:00.000Z',
//   timezone: 'Europe/Paris'
// }

const restored = DateTime.from(JSON.parse(JSON.stringify(value)))

restored.isSame(value)
// true

restored.timezone
// 'Europe/Paris'
```
