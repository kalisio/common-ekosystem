---
title: timezone
description: Utility functions for working with timezones.
---

# timezone

Utility functions for validating, normalizing, listing, and working with IANA timezones.

All timezone names use the IANA timezone database provided by `moment-timezone`. Timezone offsets and abbreviations are resolved for a specific instant to account for daylight-saving time changes.

## isValid

### Signature

```js
timezone.isValid(value)
```

### Description

Returns `true` if `value` is a valid timezone name recognized by `moment-timezone`.

Timezone names are case-insensitive, and aliases such as `US/Eastern` are accepted.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `any` | yes | The value to validate. |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid timezone name, `false` otherwise. |

### Examples

```js
timezone.isValid('Europe/Paris')
// true

timezone.isValid('europe/paris')
// true

timezone.isValid('US/Eastern')
// true

timezone.isValid('Mars/Olympus')
// false

timezone.isValid(null)
// false
```

## normalize

### Signature

```js
timezone.normalize(name)
```

### Description

Returns the normalized casing of a valid timezone name.

Timezone aliases are preserved rather than resolved to their canonical equivalents.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | The timezone name to normalize. |

### Returns

| Type | Description |
|------|-------------|
| `string` | The timezone name with normalized casing. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | The timezone name is invalid. |

### Examples

```js
timezone.normalize('europe/paris')
// 'Europe/Paris'

timezone.normalize('america/new_york')
// 'America/New_York'

timezone.normalize('us/eastern')
// 'US/Eastern'

timezone.normalize('Invalid/Timezone')
// RangeError
```

## guess

### Signature

```js
timezone.guess()
```

### Description

Detects the timezone of the current environment.

Uses `Intl.DateTimeFormat` when it returns a recognized timezone, otherwise falls back to `moment.tz.guess()`.

### Parameters

None.

### Returns

| Type | Description |
|------|-------------|
| `string` | The detected timezone name. |

### Examples

```js
timezone.guess()
// 'Europe/Paris' (depending on the environment)
```

## list

### Signature

```js
timezone.list(country)
```

### Description

Returns the available timezone names, optionally filtered by country.

Without `country`, returns all timezone names recognized by `moment-timezone`, including aliases.

When `country` is provided, returns the timezones associated with the specified ISO 3166-1 alpha-2 country code.

Country codes are case-insensitive.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `country` | `string` | no | ISO 3166-1 alpha-2 country code, such as `FR`, `US`, or `GB`. |

### Returns

| Type | Description |
|------|-------------|
| `string[]` | Array of timezone names, optionally filtered by country. |

### Throws

| Type | Description |
|------|-------------|
| `TypeError` | The country code is not a string. |
| `RangeError` | The country code is invalid or unknown. |

### Examples

```js
timezone.list()
// ['Africa/Abidjan', 'Africa/Accra', ...]

timezone.list('FR')
// ['Europe/Paris']

timezone.list('US')
// ['America/Adak', 'America/Anchorage', ...]

timezone.list('fr')
// Same result as timezone.list('FR')

timezone.list('ZZ')
// RangeError: Unknown country code: ZZ
```

## offset

### Signature

```js
timezone.offset(name, at)
```

### Description

Returns the UTC offset of a timezone at the specified instant, in minutes.

Positive values indicate offsets east of UTC, while negative values indicate offsets west of UTC.

The offset accounts for daylight-saving time and historical timezone changes.

The `at` parameter accepts a JavaScript `Date`, a Unix timestamp in milliseconds, or a strict ISO 8601 string. ISO strings without an explicit offset are interpreted in the specified timezone.

When omitted, `at` defaults to the current time.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | The IANA timezone name. |
| `at` | `Date \| number \| string` | no | The instant at which to resolve the offset. Defaults to the current time. |

### Returns

| Type | Description |
|------|-------------|
| `number` | UTC offset in minutes. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | The timezone or date is invalid. |
| `TypeError` | The date value has an unsupported type or format. |

### Examples

```js
timezone.offset('Europe/Paris', '2026-01-15T12:00:00Z')
// 60

timezone.offset('Europe/Paris', '2026-07-15T12:00:00Z')
// 120

timezone.offset('America/New_York', '2026-01-15T12:00:00Z')
// -300

timezone.offset('UTC')
// 0

timezone.offset('Europe/Paris', new Date('2026-07-15T12:00:00Z'))
// 120

timezone.offset('Invalid/Timezone')
// RangeError
```

## abbreviation

### Signature

```js
timezone.abbreviation(name, at)
```

### Description

Returns the timezone abbreviation in effect at the specified instant.

The abbreviation may change depending on daylight-saving time. For example, `Europe/Paris` uses `CET` in winter and `CEST` in summer.

Some timezones use numeric abbreviations instead of names.

The `at` parameter accepts a JavaScript `Date`, a Unix timestamp in milliseconds, or a strict ISO 8601 string. ISO strings without an explicit offset are interpreted in the specified timezone.

When omitted, `at` defaults to the current time.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | yes | The IANA timezone name. |
| `at` | `Date \| number \| string` | no | The instant at which to resolve the abbreviation. Defaults to the current time. |

### Returns

| Type | Description |
|------|-------------|
| `string` | The timezone abbreviation at the specified instant. |

### Throws

| Type | Description |
|------|-------------|
| `RangeError` | The timezone or date is invalid. |
| `TypeError` | The date value has an unsupported type or format. |

### Examples

```js
timezone.abbreviation('Europe/Paris', '2026-01-15T12:00:00Z')
// 'CET'

timezone.abbreviation('Europe/Paris', '2026-07-15T12:00:00Z')
// 'CEST'

timezone.abbreviation('America/New_York', '2026-01-15T12:00:00Z')
// 'EST'

timezone.abbreviation('America/New_York', '2026-07-15T12:00:00Z')
// 'EDT'

timezone.abbreviation('UTC')
// 'UTC'
```
