---
title: bbox
description: GeoJSON bounding-box validation, merging, computation and truncation utilities.
---

# bbox

A bounding box follows the GeoJSON convention: a 2D box is `[west, south, east, north]`, a 3D box is `[west, south, minAltitude, east, north, maxAltitude]`.

## isValidBBox

### Signature

```js
isValidBBox(bbox)
```

### Description

Returns whether the value is a valid bounding box: an array of 4 or 6 numbers whose south-west and north-east corners are valid positions, with `south <= north` and, in 3D, `minAltitude <= maxAltitude`. Longitude order is not constrained, so a box crossing the antimeridian (`west > east`) is considered valid, as allowed by the GeoJSON specification.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `any` | yes | Value to test |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid bounding box |

### Examples

```js
isValidBBox([-10, -20, 10, 20])                 // true
isValidBBox([-10, -20, -100, 10, 20, 100])      // true — 3D
isValidBBox([10, -20, -10, 20])                 // true — crosses the antimeridian
isValidBBox([-10, 20, 10, -20])                 // false — south > north
```

## is3DBBox

### Signature

```js
is3DBBox(bbox)
```

### Description

Returns whether a valid bounding box carries altitudes, i.e. has a length of 6.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `Array` | yes | A valid bounding box |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the bounding box is 3D |

### Throws

Throws if `bbox` is not a valid bounding box.

### Examples

```js
is3DBBox([-10, -20, -100, 10, 20, 100])   // true
is3DBBox([-10, -20, 10, 20])              // false
```

## mergeBBox

### Signature

```js
mergeBBox(bbox1, bbox2)
```

### Description

Returns the smallest bounding box that contains both inputs. A 3D box is returned only when both inputs are 3D; otherwise a 2D box is returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox1` | `Array` | yes | A valid bounding box |
| `bbox2` | `Array` | yes | A valid bounding box |

### Returns

| Type | Description |
|------|-------------|
| `Array` | A new bounding box containing both inputs |

### Throws

Throws if either input is not a valid bounding box.

### Examples

```js
mergeBBox([-10, -20, 10, 20], [-5, -15, 15, 25])
// [-10, -20, 15, 25]

mergeBBox([-10, -20, -100, 10, 20, 100], [-5, -15, -50, 15, 25, 200])
// [-10, -20, -100, 15, 25, 200]
```

## computeBBox

### Signature

```js
computeBBox(positions, options = {})
```

### Description

Computes the bounding box enclosing a non-empty array of positions. A 3D box is returned when at least one position carries an altitude, unless `ignore3D` is set. Missing altitudes are treated as `0` in 3D mode.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `positions` | `Array` | yes | A non-empty array of valid positions |
| `options.ignore3D` | `boolean` | no | When `true`, a 2D box is always returned (default: `false`) |

::: tip Note on `ignore3D`
This module uses `ignore3D`, whereas `isSamePosition` and the `truncate` operator use `consider3D`. The two are opposite conventions: `computeBBox` with `ignore3D: false` (the default) **considers** altitude, while `isSamePosition` with `consider3D: false` (the default) **ignores** it. Read the option name, not just the boolean value.
:::

### Returns

| Type | Description |
|------|-------------|
| `Array` | A bounding box enclosing all positions |

### Throws

Throws if `positions` is empty, contains an invalid position, or if `options` does not match the expected schema.

### Examples

```js
computeBBox([[-10, -20], [10, 20], [0, 0]])            // [-10, -20, 10, 20]
computeBBox([[-10, -20, -100], [10, 20, 100]])         // [-10, -20, -100, 10, 20, 100]
computeBBox([[-10, -20, -100], [10, 20, 100]], { ignore3D: true }) // [-10, -20, 10, 20]
```

## truncateBBox

### Signature

```js
truncateBBox(bbox, precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Truncates every value of a bounding box to the given number of decimal digits. This function mutates the bounding box in place and returns the same array.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `Array` | yes | A valid bounding box |
| `precision` | `number` | no | Number of decimal digits to keep, in range `[0, MAX_COORDINATE_PRECISION]` (default: `DEFAULT_COORDINATE_PRECISION`) |

::: warning Mutation
`truncateBBox` mutates its argument in place.
:::

### Returns

| Type | Description |
|------|-------------|
| `Array` | The same bounding box array, mutated |

### Throws

Throws if `bbox` is not a valid bounding box, or if `precision` is not in range `[0, MAX_COORDINATE_PRECISION]`.

### Examples

```js
truncateBBox([-10.123456789, -20.987654321, 10.123456789, 20.987654321])
// [-10.1234568, -20.9876543, 10.1234568, 20.9876543]

truncateBBox([-10.123456789, -20.987654321, 10.123456789, 20.987654321], 3)
// [-10.123, -20.988, 10.123, 20.988]
```