---
title: position
description: GeoJSON position parsing, validation, comparison and truncation utilities.
---

# position

A position is a `[longitude, latitude]` or `[longitude, latitude, altitude]` array, following the GeoJSON convention.

## parsePosition

### Signature

```js
parsePosition(pattern)
```

### Description

Parses a position string into a `[longitude, latitude]` array. Accepts comma, semicolon or pipe separators. When both values carry explicit directions the position is reordered to `[longitude, latitude]` regardless of input order. When both values are ambiguous, two candidate positions are returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pattern` | `string` | yes | A non-empty position string |

### Returns

| Type | Description |
|------|-------------|
| `Array \| Array[] \| null` | A `[lon, lat]` position, an array of two candidate positions when ambiguous, or `null` if unparseable |

### Throws

Throws if `pattern` is not a non-empty string.

### Examples

```js
parsePosition('2.3522E,48.8566N')   // [2.3522, 48.8566]
parsePosition('48.8566N,2.3522E')   // [2.3522, 48.8566] — reordered
parsePosition('48.8566,2.3522')     // [[48.8566, 2.3522], [2.3522, 48.8566]] — ambiguous
parsePosition('invalid')            // null
```

## isValidPosition

### Signature

```js
isValidPosition(position)
```

### Description

Returns whether the value is a valid GeoJSON position: an array of 2 or 3 numbers, with a longitude in `[-180, 180]`, a latitude in `[-90, 90]`, and, when present, a numeric altitude.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `any` | yes | Value to test |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid position |

### Examples

```js
isValidPosition([2.3522, 48.8566])        // true
isValidPosition([2.3522, 48.8566, 100])   // true
isValidPosition([181, 48.8566])           // false — longitude out of range
isValidPosition([2.3522])                 // false — wrong length
```

## is3DPosition

### Signature

```js
is3DPosition(position)
```

### Description

Returns whether a valid position carries an altitude, i.e. has a length of 3.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `Array` | yes | A valid position |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the position is 3D |

### Throws

Throws if `position` is not a valid position.

### Examples

```js
is3DPosition([2.3522, 48.8566, 100])   // true
is3DPosition([2.3522, 48.8566])        // false
```

## isSamePosition

### Signature

```js
isSamePosition(position1, position2, options = {})
```

### Description

Returns whether two positions are equal at a given precision. Comparison is done digit by digit after rounding each coordinate to `precision` decimals, so "same" means "equal once rounded to `precision`", not "identical". By default only longitude and latitude are compared; altitude is ignored.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position1` | `Array` | yes | A valid position |
| `position2` | `Array` | yes | A valid position |
| `options.precision` | `number` | no | Number of decimal digits to compare (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | When `true`, altitude is also compared (default: `false`) |

::: tip Note on `consider3D`
`consider3D` defaults to `false`, meaning two positions sharing the same longitude and latitude are considered equal even if their altitudes differ. This is deliberate: MongoDB's `2dsphere` index (S2) only indexes longitude and latitude, so for the truncation pipeline a difference in altitude alone does not make two vertices distinct. Note that `computeBBox` in the `bbox` module uses the opposite convention (`ignore3D`); the two default values do **not** describe the same behaviour.
:::

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the positions are equal at the given precision |

### Throws

Throws if either position is invalid, or if `options` does not match the expected schema.

### Examples

```js
isSamePosition([2.3522, 48.8566], [2.3522, 48.8566])                          // true
isSamePosition([2.35220001, 48.8566], [2.3522, 48.8566])                      // true — equal at precision 7
isSamePosition([2.352201, 48.8566], [2.3522, 48.8566])                        // false — differ at the 6th decimal
isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 200])               // true — altitude ignored by default
isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 200], { consider3D: true }) // false
isSamePosition([2.352, 48.856], [2.353, 48.857], { precision: 2 })           // true
```

## truncatePosition

### Signature

```js
truncatePosition(position, precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Truncates every coordinate of a position to the given number of decimal digits, altitude included. This function mutates the position in place and returns the same array.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `Array` | yes | A valid position |
| `precision` | `number` | no | Number of decimal digits to keep, in range `[0, MAX_COORDINATE_PRECISION]` (default: `DEFAULT_COORDINATE_PRECISION`) |

::: warning Mutation
Unlike `truncateCoordinate`, which is pure, `truncatePosition` mutates its argument in place. The altitude, when present, is truncated to the same decimal precision as longitude and latitude even though it is expressed in a different unit.
:::

### Returns

| Type | Description |
|------|-------------|
| `Array` | The same position array, mutated |

### Throws

Throws if `position` is not a valid position, or if `precision` is not in range `[0, MAX_COORDINATE_PRECISION]`.

### Examples

```js
truncatePosition([2.352212345, 48.856612345])         // [2.3522123, 48.8566123]
truncatePosition([2.352212345, 48.856612345], 3)      // [2.352, 48.857]
truncatePosition([2.352212345, 48.856612345, 100.5])  // [2.3522123, 48.8566123, 100.5]
```
