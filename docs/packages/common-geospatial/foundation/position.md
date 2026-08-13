---

title: position
description: GeoJSON position parsing, validation, comparison, truncation and geodesic utilities.
---

# position

A position is a `[longitude, latitude]` or `[longitude, latitude, altitude]` array, following the GeoJSON convention.

This module provides helpers to parse, validate, compare and manipulate GeoJSON positions, as well as basic geodesic operations
such as computing distances and destinations.

## parsePosition

### Signature

```js
parsePosition(pattern)
```

### Description

Parses a position string into a `[longitude, latitude]` array. Accepts comma, semicolon or pipe separators. When both values carry
explicit directions the position is reordered to `[longitude, latitude]` regardless of input order. When both values are ambiguous,
two candidate positions are returned.

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
isValidPosition([2.3522, 48.8566])        // true
isValidPosition([2.3522, 48.8566, 100])   // true
isValidPosition([181, 48.8566])           // true
isValidPosition([2.3522])                 // false
isValidPosition([2.3522, '48.8566'])      // false
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

| Name                 | Type      | Required | Description                                                                     |
| -------------------- | --------- | -------- | ------------------------------------------------------------------------------- |
| `position1`          | `Array`   | yes      | A valid position                                                                |
| `position2`          | `Array`   | yes      | A valid position                                                                |
| `options.precision`  | `number`  | no       | Decimal precision used for comparison (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no       | Compare altitude as well (default: `false`)                                     |
