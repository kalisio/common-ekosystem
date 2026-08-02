---
title: position
description: GeoJSON position parsing, validation, comparison, truncation and geodesic utilities.
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
parsePosition('48.8566N,2.3522E')   // [2.3522, 48.8566]
parsePosition('48.8566,2.3522')     // [[48.8566, 2.3522], [2.3522, 48.8566]]
parsePosition('invalid')            // null
```

---

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
isValidPosition([181, 48.8566])           // false
isValidPosition([2.3522])                 // false
```

---

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
is3DPosition([2.3522, 48.8566, 100]) // true
is3DPosition([2.3522, 48.8566])      // false
```

---

## isSamePosition

### Signature

```js
isSamePosition(position1, position2, options = {})
```

### Description

Returns whether two positions are equal at a given precision. Comparison is done after rounding each coordinate to the requested precision. By default only longitude and latitude are compared; altitude is ignored.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position1` | `Array` | yes | A valid position |
| `position2` | `Array` | yes | A valid position |
| `options.precision` | `number` | no | Decimal precision used for comparison (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | Compare altitude as well (default: `false`) |

::: tip
`consider3D` defaults to `false` because most geospatial operations (including MongoDB `2dsphere` indexes) only consider longitude and latitude.
:::

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the positions are equal |

### Throws

Throws if either position is invalid or if `options` does not match the expected schema.

### Examples

```js
isSamePosition([2.3522, 48.8566], [2.3522, 48.8566]) // true

isSamePosition(
  [2.3522, 48.8566, 100],
  [2.3522, 48.8566, 200]
) // true

isSamePosition(
  [2.3522, 48.8566, 100],
  [2.3522, 48.8566, 200],
  { consider3D: true }
) // false
```

---

## truncatePosition

### Signature

```js
truncatePosition(position, precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Truncates every coordinate of a position to the requested precision. The position is modified in place and returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `Array` | yes | A valid position |
| `precision` | `number` | no | Decimal precision in `[0, MAX_COORDINATE_PRECISION]` |

### Returns

| Type | Description |
|------|-------------|
| `Array` | The same position instance |

### Throws

Throws if the position or precision is invalid.

### Examples

```js
truncatePosition([2.352212345, 48.856612345])
// [2.3522123, 48.8566123]

truncatePosition([2.352212345, 48.856612345], 3)
// [2.352, 48.857]
```

::: warning
This function mutates the input array.
:::

---

## distanceBetweenPositions

### Signature

```js
distanceBetweenPositions(position1, position2)
```

### Description

Computes the great-circle distance between two positions on the Earth's surface.

Internally, positions are converted to n-vectors and the angular distance is multiplied by `EARTH_RADIUS`.

Altitude is ignored.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position1` | `Array` | yes | Start position |
| `position2` | `Array` | yes | End position |

### Returns

| Type | Description |
|------|-------------|
| `number` | Distance in metres |

### Throws

Throws if either position is invalid.

### Examples

```js
distanceBetweenPositions(
  [2.3522, 48.8566],
  [2.2945, 48.8584]
)
// ≈ 4200
```

---

## destinationFromPosition

### Signature

```js
destinationFromPosition(position, bearing, distance)
```

### Description

Computes the destination reached by travelling from a starting position along a great-circle path.

The bearing is expressed clockwise from geographic north and the distance in metres.

Altitude is not propagated to the resulting position.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `Array` | yes | Starting position |
| `bearing` | `number` | yes | Initial bearing, in degrees |
| `distance` | `number` | yes | Travel distance, in metres |

### Returns

| Type | Description |
|------|-------------|
| `Array` | Destination position as `[longitude, latitude]` |

### Throws

Throws if any argument is invalid.

### Examples

```js
destinationFromPosition(
  [2.3522, 48.8566],
  90,
  1000
)
// ≈ [2.3658, 48.8565]

destinationFromPosition(
  [2.3522, 48.8566],
  0,
  1000
)
// ≈ [2.3522, 48.8656]
```