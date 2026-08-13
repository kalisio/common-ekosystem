---
title: coordinate
description: Coordinate parsing, conversion, truncation, normalization and precision utilities.
---

# coordinate

## Constants

### DEFAULT_COORDINATE_PRECISION

The default number of decimal digits used when truncating coordinates. Its value is `7`, which corresponds to roughly 1 cm in WGS84.

This constant is the single source of truth for coordinate precision across the package. `truncateCoordinate`, `truncatePosition`, `truncateBBox`, `truncateGeoJson` and `isSamePosition` all default to it. Any operator or validator that reasons about precision should import it from here rather than hard-coding a value, so that the whole chain stays aligned.

```js
DEFAULT_COORDINATE_PRECISION // 7
```

### MAX_COORDINATE_PRECISION

The maximum precision accepted by the truncation functions. Its value is `8`. Precision arguments are validated against the inclusive range `[0, MAX_COORDINATE_PRECISION]`.

```js
MAX_COORDINATE_PRECISION // 8
```

### COORDINATE_TRUNCATION_FACTORS

Array of powers of 10 indexed by precision, used for coordinate truncation. It holds `MAX_COORDINATE_PRECISION + 1` entries so that every valid precision, including the maximum, indexes a defined factor.

```js
COORDINATE_TRUNCATION_FACTORS = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]
// index 0 → 10^0 = 1
// index 8 → 10^8 = 100000000
```

### COORDINATE_FORMATS

Re-exported from `coordinate-formats`. Enum of supported coordinate string formats.

### COORDINATE_MODELS

Re-exported from `coordinate-formats`. Parsers keyed by format, each returning a coordinate model instance.

## guessCoordinateAxis

### Signature

```js
guessCoordinateAxis(coord, dir)
```

### Description

Infers the axis of a coordinate value. If a direction is provided, the axis is derived from the direction. Otherwise, if the absolute value exceeds 90, the coordinate is assumed to be a longitude.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coord` | `number` | yes | Coordinate value |
| `dir` | `string` | no | A cardinal direction label or symbol |

### Returns

| Type | Description |
|------|-------------|
| `string \| undefined` | An axis value from `AXES`, or `undefined` if the axis cannot be determined |

### Throws

Throws if `coord` is not a number, or if `dir` is provided but is not a valid direction.

### Examples

```js
guessCoordinateAxis(48.8, 'N')    // 'LAT'
guessCoordinateAxis(2.3, 'E')     // 'LON'
guessCoordinateAxis(120)          // 'LON' — absolute value > 90
guessCoordinateAxis(45)           // undefined — ambiguous
```

## getCoordinatePrecision

### Signature

```js
getCoordinatePrecision(coord)
```

### Description

Returns the number of significant decimal digits of a coordinate value.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coord` | `number` | yes | Coordinate value |

### Returns

| Type | Description |
|------|-------------|
| `number` | Number of decimal digits |

### Throws

Throws if `coord` is not a number.

### Examples

```js
getCoordinatePrecision(48.8566)      // 4
getCoordinatePrecision(2.3)          // 1
getCoordinatePrecision(100)          // 0
```

## truncateCoordinate

### Signature

```js
truncateCoordinate(coord, precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Reduces the precision of a coordinate to the specified number of decimal places.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coord` | `number` | yes | Coordinate value |
| `precision` | `number` | no | Number of decimal digits to keep, in range `[0, MAX_COORDINATE_PRECISION]` (default: `DEFAULT_COORDINATE_PRECISION`) |

The `precision`, i.e. number of decimal digits, in GPS coordinates directly determines location precision:

| Decimal digits | Precision in meters |
|---|---|
| 0 | ~111 km |
| 1 | ~11.1 km |
| 2 | ~1.1 km |
| 3 | ~111 m |
| 4 | ~11.1 m |
| 5 | ~1.11 m |
| 6 | ~0.11 m (11 cm) |
| 7 | ~1.1 cm |
| 8 | ~1.1 mm |

### Returns

| Type | Description |
|------|-------------|
| `number` | The truncated coordinate value |

### Throws

Throws if `coord` is not a number, or if `precision` is not in range `[0, MAX_COORDINATE_PRECISION]`.

### Examples

```js
truncateCoordinate(48.123456789)      // 48.1234568
truncateCoordinate(48.123456789, 3)   // 48.123
truncateCoordinate(48.123456789, 0)   // 48
```

## normalizeCoordinate

### Signature

```js
normalizeCoordinate(coord, axis)
```

### Description

Normalizes a coordinate value to its valid range for the given axis. Latitude values are clamped to `[-90, 90]`. Longitude values are wrapped to `[-180, 180]`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coord` | `number` | yes | Coordinate value |
| `axis` | `string` | yes | `AXES.LATITUDE` or `AXES.LONGITUDE` |

### Returns

| Type | Description |
|------|-------------|
| `number` | The normalized coordinate value |

### Throws

Throws if `coord` is not a number, or if `axis` is neither latitude nor longitude.

### Examples

```js
normalizeCoordinate(95, 'LAT')    // 90 — clamped
normalizeCoordinate(-95, 'LAT')   // -90 — clamped

normalizeCoordinate(190, 'LON')   // -170 — wrapped
normalizeCoordinate(-180, 'LON')  // 180
normalizeCoordinate(0, 'LON')     // 0
```

## convertCoordinate

### Signature

```js
convertCoordinate(from, to)
```

### Description

Converts a coordinate model instance from its current format to the target format. The `from` value must be a valid coordinate model with an `isValid()` method. Internally converts to DD first, then to the target format.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `object` | yes | A valid coordinate model instance |
| `to` | `string` | yes | Target format, one of `COORDINATE_FORMATS` |

### Returns

| Type | Description |
|------|-------------|
| `object \| null` | A coordinate model instance in the target format, or `null` if conversion fails |

### Throws

Throws if `from` is not a valid coordinate model, or if `to` is an unknown format.

### Examples

```js
const coord = parseCoordinate('48.8566')
convertCoordinate(coord, COORDINATE_FORMATS.DMS)
// coordinate model in DMS format
```

## parseCoordinate

### Signature

```js
parseCoordinate(pattern)
```

### Description

Parses a coordinate string and returns the first matching coordinate model. Tries all known formats in order. Returns `null` if no format matches.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pattern` | `string` | yes | A non-empty coordinate string |

### Returns

| Type | Description |
|------|-------------|
| `object \| null` | A coordinate model instance, or `null` if no format matched |

### Throws

Throws if `pattern` is not a non-empty string.

### Examples

```js
parseCoordinate('48.8566')       // DD coordinate model
parseCoordinate('48°51\'24"N')   // DMS coordinate model
parseCoordinate('invalid')       // null
```