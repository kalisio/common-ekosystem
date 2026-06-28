---
title: position
description: Helper functions for working with positions.
---

# parsePosition

## Signature

```js
parsePosition(pattern)
```

## Description

Parses a string containing two coordinate values separated by a delimiter (`,`, `;`, or `|`) and returns a GeoJSON position `[longitude, latitude]`. Each part is parsed independently using `parseCoordinate`, and the axis of each value is inferred using `guessCoordinateAxis`.

If both axes can be determined unambiguously, the coordinates are reordered to `[longitude, latitude]` regardless of the input order. If neither axis can be determined (both values are in the `[-90, 90]` range with no direction hint), two candidate positions are returned.

Returns `null` if the pattern cannot be parsed.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pattern` | `string` | yes | A non-empty string containing two coordinate values separated by `,`, `;`, or `|` |

## Returns

| Type | Description |
|------|-------------|
| `number[]` | A GeoJSON position `[longitude, latitude]` |
| `number[][]` | Two candidate positions if the axis of both values is ambiguous |
| `null` | If the pattern cannot be parsed or does not contain exactly two values |

## Throws

Throws if `pattern` is not a non-empty string.

## Examples

```js
// Latitude, longitude with direction symbols
parsePosition('48.8566N, 2.3522E')
// [2.3522, 48.8566]
```

```js
// Longitude first
parsePosition('2.3522E, 48.8566N')
// [2.3522, 48.8566]
```

```js
// Plain decimal, unambiguous — one value > 90 is treated as longitude
parsePosition('48.8566, 120.5')
// [120.5, 48.8566]
```

```js
// Semicolon delimiter
parsePosition('48.8566N; 2.3522E')
// [2.3522, 48.8566]
```

```js
// Pipe delimiter
parsePosition('48.8566N | 2.3522E')
// [2.3522, 48.8566]
```

```js
// South and West directions produce negative values
parsePosition('34.6037S, 58.3816W')
// [-58.3816, -34.6037]
```

```js
// Ambiguous — both values in [-90, 90], no direction hint
parsePosition('45, 12')
// [[45, 12], [12, 45]]
```

```js
// Invalid — only one part
parsePosition('48.8566')
// null
```

```js
// Invalid — unparseable coordinate
parsePosition('abc, def')
// null
```

# isValidPosition

## Signature

```js
isValidPosition (value)
```

## Description

Returns `true` if `value` is a valid GeoJSON position: an array of 2 or 3 finite numbers where longitude is in `[-180, 180]` and latitude is in `[-90, 90]`. Altitude, if present, must be a finite number.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `*` | yes | The value to check |

## Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid GeoJSON position |

## Examples

```js
isValidPosition([2.3522, 48.8566])        // true
isValidPosition([2.3522, 48.8566, 100])   // true
isValidPosition([181, 48.8566])           // false — longitude out of range
isValidPosition([2.3522, 91])             // false — latitude out of range
isValidPosition([2.3522])                 // false — too few elements
isValidPosition(null)                     // false
```

# is3DPosition

## Signature

```js
is3DPosition (position)
```

## Description

Returns `true` if `position` is a valid GeoJSON position with an altitude coordinate (3 elements).

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `number[]` | yes | A valid GeoJSON position |

## Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the position has 3 coordinates |

## Throws

Throws if `position` is not a valid GeoJSON position.

## Examples

```js
is3DPosition([2.3522, 48.8566, 100])  // true
is3DPosition([2.3522, 48.8566])       // false
is3DPosition(null)                    // throws
```

# isSamePosition

## Signature

```js
isSamePosition (position1, position2, options)
```

## Description

Returns `true` if two GeoJSON positions are equal within the given decimal precision. By default only longitude and latitude are compared; altitude comparison can be enabled via `consider3D`.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position1` | `number[]` | yes | A valid GeoJSON position |
| `position2` | `number[]` | yes | A valid GeoJSON position |
| `options` | `object` | no | Comparison options |
| `options.precision` | `number` | no | Decimal places for comparison (default: `10`) |
| `options.consider3D` | `boolean` | no | Whether to include altitude in comparison (default: `false`) |

## Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the positions are equal within the given precision |

## Throws

Throws if either position is not a valid GeoJSON position, or if `options` is invalid.

## Examples

```js
isSamePosition([2.3522, 48.8566], [2.3522, 48.8566])
// true

isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 200])
// true — altitude ignored by default

isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 200], { consider3D: true })
// false — altitudes differ

isSamePosition([2.352, 48.856], [2.353, 48.857], { precision: 2 })
// true — equal at 2 decimal places

isSamePosition([2.352, 48.856], [2.353, 48.857], { precision: 3 })
// false — differ at 3 decimal places
```