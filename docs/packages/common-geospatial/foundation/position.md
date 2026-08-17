---
title: position
description: GeoJSON position parsing, validation, comparison, truncation, reprojection, and geodesic utilities.
---

# position

A position is a `[longitude, latitude]` or `[longitude, latitude, altitude]` array, following the GeoJSON convention.

This module provides helpers to parse, validate, compare and manipulate GeoJSON positions, as well as basic geodesic operations such as computing distances and destinations.

## parsePosition

### Signature

```js
parsePosition(pattern)
```

### Description

Parses a position string into a `[longitude, latitude]` array. Accepts comma, semicolon or pipe separators. When both values carry explicit directions the position is reordered to `[longitude, latitude]` regardless of input order. When both values are ambiguous, two candidate positions are returned.

### Parameters

| Name      | Type     | Required | Description                 |
| --------- | -------- | -------- | --------------------------- |
| `pattern` | `string` | yes      | A non-empty position string |

### Returns

| Type                       | Description                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Array \| Array[] \| null` | A `[lon, lat]` position, an array of two candidate positions when ambiguous, or `null` if unparseable |

### Throws

Throws if `pattern` is not a non-empty string.

### Examples

```js
parsePosition('2.3522E,48.8566N') // [2.3522, 48.8566]
parsePosition('48.8566N,2.3522E') // [2.3522, 48.8566]
parsePosition('48.8566,2.3522')   // [[48.8566, 2.3522], [2.3522, 48.8566]]
parsePosition('invalid')          // null
```

## isValidPosition

### Signature

```js
isValidPosition(position)
```

### Description

Returns whether the value is a valid position representation: an array of 2 or 3 numbers.

This function only checks the structure and type of the coordinates. It does not check longitude or latitude ranges.

### Parameters

| Name       | Type  | Required | Description   |
| ---------- | ----- | -------- | ------------- |
| `position` | `any` | yes      | Value to test |

### Returns

| Type      | Description                             |
| --------- | --------------------------------------- |
| `boolean` | `true` if the value is a valid position |

### Examples

```js
isValidPosition([2.3522, 48.8566])      // true
isValidPosition([2.3522, 48.8566, 100]) // true
isValidPosition([181, 48.8566])         // true
isValidPosition([2.3522])               // false
isValidPosition([2.3522, '48.8566'])    // false
```

## is3DPosition

### Signature

```js
is3DPosition(position)
```

### Description

Returns whether a valid position carries an altitude, i.e. has a length of 3.

### Parameters

| Name       | Type    | Required | Description      |
| ---------- | ------- | -------- | ---------------- |
| `position` | `Array` | yes      | A valid position |

### Returns

| Type      | Description                  |
| --------- | ---------------------------- |
| `boolean` | `true` if the position is 3D |

### Throws

Throws if `position` is not a valid position.

### Examples

```js
is3DPosition([2.3522, 48.8566, 100]) // true
is3DPosition([2.3522, 48.8566])      // false
```

## isSamePosition

### Signature

```js
isSamePosition(position1, position2, options = {})
```

### Description

Returns whether two positions are equal at a given precision. Comparison is done after rounding each coordinate to the requested precision.

By default only longitude and latitude are compared; altitude is ignored.

### Parameters

| Name                 | Type      | Required | Description                                                                       |
| -------------------- | --------- | -------- | --------------------------------------------------------------------------------- |
| `position1`          | `Array`   | yes      | A valid position                                                                  |
| `position2`          | `Array`   | yes      | A valid position                                                                  |
| `options.precision`  | `number`  | no       | Decimal precision used for comparison. Defaults to `DEFAULT_COORDINATE_PRECISION` |
| `options.consider3D` | `boolean` | no       | Compare altitude as well. Defaults to `false`                                     |

### Returns

| Type      | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `boolean` | `true` if the positions are equal at the requested precision |

### Throws

Throws if either position is invalid or if `options` does not match the expected schema.

### Examples

```js
isSamePosition([2.3522, 48.8566], [2.3522, 48.8566])
// true

isSamePosition([2.3522, 48.8566, 100], [2.3522, 48.8566, 200])
// true

isSamePosition(
  [2.3522, 48.8566, 100],
  [2.3522, 48.8566, 200],
  { consider3D: true }
)
// false
```

## truncatePosition

### Signature

```js
truncatePosition(position, precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Truncates every coordinate of a position to the requested number of decimal places.

The input position is modified in place and returned.

### Parameters

| Name        | Type     | Required | Description                                                          |
| ----------- | -------- | -------- | -------------------------------------------------------------------- |
| `position`  | `Array`  | yes      | A valid position                                                     |
| `precision` | `number` | no       | Number of decimal places. Defaults to `DEFAULT_COORDINATE_PRECISION` |

### Returns

| Type    | Description                  |
| ------- | ---------------------------- |
| `Array` | The truncated input position |

### Throws

Throws if `position` is invalid or if `precision` is outside the supported range.

### Examples

```js
const position = [2.3522345, 48.8566789]
truncatePosition(position, 3)
// [2.352, 48.856]
```

## reprojectPosition

### Signature

```js
reprojectPosition(position, source, target)
```

### Description

Reprojects a position from a source projection to a target projection using proj4.

Both projections must already be registered.

### Parameters

| Name       | Type     | Required | Description            |
| ---------- | -------- | -------- | ---------------------- |
| `position` | `Array`  | yes      | A valid position       |
| `source`   | `string` | yes      | Source projection name |
| `target`   | `string` | yes      | Target projection name |

### Returns

| Type    | Description              |
| ------- | ------------------------ |
| `Array` | The reprojected position |

### Throws

Throws if `position` is invalid or if either projection is not registered.

### Examples

```js
reprojectPosition([2.3522, 48.8566], 'EPSG:4326', 'EPSG:3857')
// [261845..., 6250564...]
```

## destinationFromPosition

### Signature

```js
destinationFromPosition(position, bearing, distance)
```

### Description

Computes a destination position from an initial geographic position, a bearing, and a distance on a spherical Earth.

The bearing is expressed in degrees and the distance in meters.

### Parameters

| Name       | Type     | Required | Description                  |
| ---------- | -------- | -------- | ---------------------------- |
| `position` | `Array`  | yes      | Starting geographic position |
| `bearing`  | `number` | yes      | Bearing in degrees           |
| `distance` | `number` | yes      | Distance in meters           |

### Returns

| Type    | Description                                  |
| ------- | -------------------------------------------- |
| `Array` | Destination `[longitude, latitude]` position |

### Throws

Throws if `position` is invalid or if `bearing` or `distance` is not a number.

### Examples

```js
destinationFromPosition([2.3522, 48.8566], 90, 1000)
// destination approximately 1 km east of the starting position
```

## distanceBetweenPositions

### Signature

```js
distanceBetweenPositions(position1, position2)
```

### Description

Computes the great-circle distance between two geographic positions on a spherical Earth.

The returned distance is expressed in meters.

### Parameters

| Name        | Type    | Required | Description                |
| ----------- | ------- | -------- | -------------------------- |
| `position1` | `Array` | yes      | First geographic position  |
| `position2` | `Array` | yes      | Second geographic position |

### Returns

| Type     | Description                              |
| -------- | ---------------------------------------- |
| `number` | Distance between the positions in meters |

### Throws

Throws if either position is invalid.

### Examples

```js
distanceBetweenPositions(
  [2.3522, 48.8566],
  [2.2945, 48.8584]
)
// distance in meters
```
