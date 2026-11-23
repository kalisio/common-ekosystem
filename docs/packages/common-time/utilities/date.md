---
title: date
description: Utility functions for parsing, formatting, comparing, and manipulating dates.
---

# date

Utility functions for parsing, validating, formatting, comparing, and manipulating dates with timezone support.

Dates are represented as native JavaScript `Date` instances. Operations use `moment-timezone` internally without exposing Moment instances.

The default timezone is `UTC`. Formatting and period boundaries use English (`en`) by default.

```js
import { date } from '@kalisio/common-time'
```

## parse

### Signature

```js
date.parse(value, options)
```

### Description

Parses a date value and returns a new native JavaScript `Date` instance.

Accepts a `Date`, a timestamp in milliseconds, or a strictly parsed ISO 8601 string. A custom parsing format can also be provided. Locale-sensitive tokens such as `MMMM` use Moment’s active locale.

Strings without an explicit UTC offset are interpreted in the specified timezone, or UTC by default. Strings with an explicit offset preserve the instant defined by that offset, regardless of the timezone option.

Daylight-saving transitions follow Moment's behavior:

- Nonexistent local times are shifted forward by the DST gap.
- Ambiguous local times are resolved to their earlier occurrence.

The input is never mutated.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string` | yes | Date, timestamp in milliseconds, or date string. |
| `options` | `object` | no | Parsing options. |
| `options.format` | `string` | no | Custom Moment parsing format. Defaults to strict ISO 8601 parsing. |
| `options.timezone` | `string` | no | IANA timezone used to interpret local date strings. Defaults to `UTC`. |

### Returns

| Type | Description |
|------|-------------|
| `Date` | A new native JavaScript `Date` representing the parsed instant. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The input type or format option is invalid. |
| `RangeError` | The date string, timestamp, or timezone is invalid. |

### Examples

```js
date.parse('2026-11-20').toISOString()
// '2026-11-20T00:00:00.000Z'

date.parse('2026-11-20T14:00:00+01:00').toISOString()
// '2026-11-20T13:00:00.000Z'

date.parse('2026-11-20T14:00:00').toISOString()
// '2026-11-20T14:00:00.000Z'

date.parse('2026-11-20T14:00:00', {
  timezone: 'Europe/Paris'
}).toISOString()
// '2026-11-20T13:00:00.000Z'

date.parse('20/11/2026 14:00', {
  format: 'DD/MM/YYYY HH:mm',
  timezone: 'Europe/Paris'
}).toISOString()
// '2026-11-20T13:00:00.000Z'

date.parse(0).toISOString()
// '1970-01-01T00:00:00.000Z'

date.parse('invalid')
// RangeError
```

## format

### Signature

```js
date.format(value, pattern, options)
```

### Description

Formats a date in the specified timezone and locale using Moment formatting tokens.

The default format is `YYYY-MM-DDTHH:mm:ss.SSSZ`. The default timezone is UTC and the default locale is English.

The requested [locale](../runtime/locales.md) must already be loaded in Moment.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string` | yes | Date to format. |
| `pattern` | `string` | no | Moment formatting pattern. Defaults to `YYYY-MM-DDTHH:mm:ss.SSSZ`. |
| `options` | `object` | no | Formatting options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC`. |
| `options.locale` | `string` | no | Loaded Moment locale. Defaults to `en`. |

### Returns

| Type | Description |
|------|-------------|
| `string` | Formatted date string. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The formatting pattern or date input type is invalid. |
| `RangeError` | The date, timezone, or locale is invalid. |

### Examples

```js
date.format('2026-11-20T13:00:00Z')
// '2026-11-20T13:00:00.000+00:00'

date.format('2026-11-20T13:00:00Z', 'YYYY-MM-DD HH:mm', {
  timezone: 'Europe/Paris'
})
// '2026-11-20 14:00'

date.format('2026-11-20T13:00:00Z', 'HH:mm z', {
  timezone: 'Europe/Paris'
})
// '14:00 CET'

// Load French as shown in Time locales before running this example.
date.format('2026-11-20T13:00:00Z', 'dddd D MMMM', {
  locale: 'fr'
})
// 'vendredi 20 novembre'
```

## add

### Signature

```js
date.add(value, amount, unit, options)
```

### Description

Adds a numeric amount of time to a date and returns a new `Date`.

Negative amounts subtract time.

Calendar units are applied in the specified timezone, taking daylight-saving transitions and varying month lengths into account.

Fractional calendar amounts follow Moment's rounding rules. Days and months are rounded to the nearest integer, with halves rounded away from zero; weeks, quarters, and years follow the corresponding calendar-unit conversions. Fractions of hours and smaller units contribute to the result at whole-millisecond precision.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string` | yes | Starting date. |
| `amount` | `number` | yes | Finite amount to add. May be negative. |
| `unit` | `string` | yes | Unit of time. |
| `options` | `object` | no | Addition options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC`. |

Supported units: `year`, `quarter`, `month`, `week`, `isoWeek`, `day`, `hour`, `minute`, `second`, and `millisecond`, including supported Moment aliases.

### Returns

| Type | Description |
|------|-------------|
| `Date` | A new date with the amount added. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The amount is not a finite number or the input type is invalid. |
| `RangeError` | The date, unit, or timezone is invalid. |

### Examples

```js
date.add('2026-11-20T13:00:00Z', 2, 'hours').toISOString()
// '2026-11-20T15:00:00.000Z'

date.add('2026-11-20T13:00:00Z', -1, 'day').toISOString()
// '2026-11-19T13:00:00.000Z'

date.add('2026-01-31T00:00:00Z', 1, 'month').toISOString()
// '2026-02-28T00:00:00.000Z'

date.add('2026-03-28T12:00:00Z', 1, 'day', {
  timezone: 'Europe/Paris'
}).toISOString()
// '2026-03-29T11:00:00.000Z'

date.add('2026-03-28T12:00:00Z', 24, 'hours', {
  timezone: 'Europe/Paris'
}).toISOString()
// '2026-03-29T12:00:00.000Z'
```

## addDuration

### Signature

```js
date.addDuration(value, iso, options)
```

### Description

Adds an ISO 8601 duration to a date and returns a new `Date`.

Calendar components are applied in the specified timezone. For example, adding one calendar day may produce an elapsed time of 23 or 25 hours across a daylight-saving transition.

The duration is validated using `duration.parse()`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string` | yes | Starting date. |
| `iso` | `string` | yes | ISO 8601 duration to add. |
| `options` | `object` | no | Addition options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC`. |

### Returns

| Type | Description |
|------|-------------|
| `Date` | A new date with the duration added. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | An input has an unsupported type. |
| `RangeError` | The date, timezone, or duration is invalid. |

### Examples

```js
date.addDuration('2026-11-20T12:00:00Z', 'PT3H').toISOString()
// '2026-11-20T15:00:00.000Z'

date.addDuration('2026-03-28T12:00:00Z', 'P1D', {
  timezone: 'Europe/Paris'
}).toISOString()
// '2026-03-29T11:00:00.000Z'

date.addDuration('2026-11-20T12:00:00Z', '-PT3H').toISOString()
// '2026-11-20T09:00:00.000Z'
```

## subtractDuration

### Signature

```js
date.subtractDuration(value, iso, options)
```

### Description

Subtracts an ISO 8601 duration from a date and returns a new `Date`.

Calendar components are evaluated in the specified timezone. The input date is not mutated.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string` | yes | Starting date. |
| `iso` | `string` | yes | ISO 8601 duration to subtract. |
| `options` | `object` | no | Subtraction options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC`. |

### Returns

| Type | Description |
|------|-------------|
| `Date` | A new date with the duration subtracted. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | An input has an unsupported type. |
| `RangeError` | The date, timezone, or duration is invalid. |

### Examples

```js
date.subtractDuration('2026-11-20T12:00:00Z', 'PT3H').toISOString()
// '2026-11-20T09:00:00.000Z'

date.subtractDuration('2026-11-20T12:00:00Z', 'P1D').toISOString()
// '2026-11-19T12:00:00.000Z'

date.subtractDuration('2026-11-20T12:00:00Z', '-PT1H').toISOString()
// '2026-11-20T13:00:00.000Z'
```

## startOf

### Signature

```js
date.startOf(value, unit, options)
```

### Description

Returns the start of the calendar period containing the specified date.

Period boundaries are calculated in the selected timezone.

For the `week` unit, the first day of the week depends on the locale. The `isoWeek` unit always starts on Monday.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string` | yes | Date within the period. |
| `unit` | `string` | yes | Calendar or time unit. |
| `options` | `object` | no | Calculation options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC`. |
| `options.locale` | `string` | no | Loaded Moment locale. Defaults to `en`. |

Supported units: `year`, `quarter`, `month`, `week`, `isoWeek`, `day`, `date`, `hour`, `minute`, `second`, and `millisecond`.

### Returns

| Type | Description |
|------|-------------|
| `Date` | A new date representing the start of the period. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The date input type is invalid. |
| `RangeError` | The date, unit, timezone, or locale is invalid. |

### Examples

```js
date.startOf('2026-11-20T13:00:00Z', 'day').toISOString()
// '2026-11-20T00:00:00.000Z'

date.startOf('2026-11-20T13:00:00Z', 'month').toISOString()
// '2026-11-01T00:00:00.000Z'

date.startOf('2026-11-20T13:00:00Z', 'isoWeek').toISOString()
// '2026-11-16T00:00:00.000Z'

// Load French as shown in Time locales before running this example.
date.startOf('2026-11-20T13:00:00Z', 'week', {
  locale: 'fr'
}).toISOString()
// '2026-11-16T00:00:00.000Z'
```

## endOf

### Signature

```js
date.endOf(value, unit, options)
```

### Description

Returns the last millisecond of the calendar period containing the specified date.

Uses the same timezone, locale, and unit rules as `startOf`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `Date \| number \| string` | yes | Date within the period. |
| `unit` | `string` | yes | Calendar or time unit. |
| `options` | `object` | no | Calculation options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC`. |
| `options.locale` | `string` | no | Loaded Moment locale. Defaults to `en`. |

### Returns

| Type | Description |
|------|-------------|
| `Date` | A new date representing the last millisecond of the period. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The date input type is invalid. |
| `RangeError` | The date, unit, timezone, or locale is invalid. |

### Examples

```js
date.endOf('2026-11-20T13:00:00Z', 'day').toISOString()
// '2026-11-20T23:59:59.999Z'

date.endOf('2026-11-20T13:00:00Z', 'month').toISOString()
// '2026-11-30T23:59:59.999Z'

date.endOf('2028-02-10T12:00:00Z', 'month').toISOString()
// '2028-02-29T23:59:59.999Z'

// Load French as shown in Time locales before running this example.
date.endOf('2026-11-20T13:00:00Z', 'week', {
  locale: 'fr'
}).toISOString()
// '2026-11-22T23:59:59.999Z'
```

## diff

### Signature

```js
date.diff(left, right, unit, options)
```

### Description

Returns the signed difference between two dates, calculated as `left - right`.

The result is expressed in the requested unit, milliseconds by default.

By default, fractional results are truncated toward zero. Set `floating` to `true` to preserve fractional results.

Calendar differences account for the specified timezone, including daylight-saving transitions.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `left` | `Date \| number \| string` | yes | First date. |
| `right` | `Date \| number \| string` | yes | Second date. |
| `unit` | `string` | no | Difference unit. Defaults to `milliseconds`. |
| `options` | `object` | no | Calculation options. |
| `options.timezone` | `string` | no | IANA timezone. Defaults to `UTC`. |
| `options.floating` | `boolean` | no | Preserve fractional results. Defaults to `false`. |

Supported units: `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second`, and `millisecond`.

### Returns

| Type | Description |
|------|-------------|
| `number` | Signed difference in the requested unit. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | A date input has an unsupported type. |
| `RangeError` | A date, unit, or timezone is invalid. |

### Examples

```js
date.diff(
  '2026-11-20T13:30:00Z',
  '2026-11-20T12:00:00Z'
)
// 5400000

date.diff(
  '2026-11-20T13:30:00Z',
  '2026-11-20T12:00:00Z',
  'minutes'
)
// 90

date.diff(
  '2026-11-20T12:00:00Z',
  '2026-11-20T13:30:00Z',
  'hours'
)
// -1

date.diff(
  '2026-11-20T12:00:00Z',
  '2026-11-20T13:30:00Z',
  'hours',
  { floating: true }
)
// -1.5
```

## isBefore

### Signature

```js
date.isBefore(left, right, options)
```

### Description

Returns `true` if the first date represents an instant strictly before the second date.

Comparisons are performed on absolute timestamps. Strings without an explicit offset are interpreted using the supplied timezone.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `left` | `Date \| number \| string` | yes | First date. |
| `right` | `Date \| number \| string` | yes | Second date. |
| `options` | `object` | no | Parsing options, including `format` and `timezone`. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if `left` is strictly before `right`. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | An input has an unsupported type or parsing option. |
| `RangeError` | An input date, format, or timezone is invalid. |

### Examples

```js
date.isBefore('2026-11-20T12:00:00Z', '2026-11-20T13:00:00Z')
// true

date.isBefore('2026-11-20T13:00:00Z', '2026-11-20T12:00:00Z')
// false

date.isBefore('2026-11-20T12:00:00Z', '2026-11-20T12:00:00Z')
// false
```

## isAfter

### Signature

```js
date.isAfter(left, right, options)
```

### Description

Returns `true` if the first date represents an instant strictly after the second date.

Uses the same parsing and timezone rules as `isBefore`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `left` | `Date \| number \| string` | yes | First date. |
| `right` | `Date \| number \| string` | yes | Second date. |
| `options` | `object` | no | Parsing options, including `format` and `timezone`. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if `left` is strictly after `right`. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | An input has an unsupported type or parsing option. |
| `RangeError` | An input date, format, or timezone is invalid. |

### Examples

```js
date.isAfter('2026-11-20T13:00:00Z', '2026-11-20T12:00:00Z')
// true

date.isAfter('2026-11-20T12:00:00Z', '2026-11-20T13:00:00Z')
// false

date.isAfter('2026-11-20T12:00:00Z', '2026-11-20T12:00:00Z')
// false
```

## isSame

### Signature

```js
date.isSame(left, right, options)
```

### Description

Returns `true` if both dates represent exactly the same instant, with millisecond precision.

Different timezone representations of the same instant are considered equal.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `left` | `Date \| number \| string` | yes | First date. |
| `right` | `Date \| number \| string` | yes | Second date. |
| `options` | `object` | no | Parsing options, including `format` and `timezone`. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if both dates represent the same instant. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | An input has an unsupported type or parsing option. |
| `RangeError` | An input date, format, or timezone is invalid. |

### Examples

```js
date.isSame(
  '2026-11-20T12:00:00Z',
  '2026-11-20T13:00:00+01:00'
)
// true

date.isSame(
  '2026-11-20T12:00:00Z',
  '2026-11-20T12:00:01Z'
)
// false

date.isSame(new Date(0), 0)
// true
```

## isValid

### Signature

```js
date.isValid(value, options)
```

### Description

Returns `true` if the value can be parsed as a date.

Accepts the same inputs and parsing options as `date.parse`.

Returns `false` instead of throwing for invalid inputs, dates, formats, or timezones.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `any` | yes | Value to validate. |
| `options` | `object` | no | Parsing options, including `format` and `timezone`. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the date is valid, `false` otherwise. |

### Examples

```js
date.isValid('2026-11-20')
// true

date.isValid('2026-11-20T14:00:00+01:00')
// true

date.isValid(0)
// true

date.isValid('20/11/2026', {
  format: 'DD/MM/YYYY'
})
// true

date.isValid('2026-02-30')
// false

date.isValid('not-a-date')
// false

date.isValid(null)
// false

date.isValid('2026-11-20', {
  timezone: 'Mars/Olympus'
})
// false
```

## floor, ceil, round

### Signatures

```js
date.floor(value, step, options)
date.ceil(value, step, options)
date.round(value, step, options)
```

### Description

Aligns an instant to a grid of equally spaced instants. `floor` selects the grid point at or before the instant, `ceil` selects the point at or after it, and `round` selects the nearest point. Ties in `round` favor the later point. Grid spacing is measured in elapsed milliseconds across timezone offset changes.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `DateTime \| Date \| number \| string` | yes | Instant to align. ISO strings without an offset use UTC. |
| `step` | `Duration \| string \| number` | yes | Fixed time duration or millisecond count. It must resolve to a positive safe integer in milliseconds. |
| `options.origin` | `DateTime \| Date \| number \| string` | no | Grid anchor. Defaults to the Unix epoch. |

### Returns

| Type | Description |
|------|-------------|
| `Date` | A new native date at the selected grid point. |

### Throws

An invalid step, a distance from the origin outside the safe integer range, or a result outside the native Date range throws a `RangeError`. Very large steps or distances can cause rounding errors even when both values are safe integers.

### Examples

```js
date.floor('2026-11-20T12:28:00Z', 'PT15M').toISOString()
// '2026-11-20T12:15:00.000Z'

date.ceil('2026-11-20T12:28:00Z', 'PT15M').toISOString()
// '2026-11-20T12:30:00.000Z'

date.round(1500, 1000).getTime()
// 2000
```
