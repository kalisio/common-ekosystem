---
title: position
description: Helper functions for working with bounding boxes.
---

# isValidBBox

## Signature

```js
isValidBBox (value)
```

## Description

Returns `true` if `value` is a valid GeoJSON bounding box: an array of 4 (2D) or 6 (3D) numbers where the south-west and north-east corners are valid positions and south is less than or equal to north. A bbox crossing the antimeridian (west > east) is considered valid.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `*` | yes | The value to check |

## Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid GeoJSON bounding box |

## Examples

```js
isValidBBox([-10, -20, 10, 20])              // true
isValidBBox([-10, -20, -100, 10, 20, 100])   // true — 3D
isValidBBox([10, -20, -10, 20])              // true — crosses antimeridian
isValidBBox([-181, -20, 10, 20])             // false — longitude out of range
isValidBBox([-10, 20, 10, -20])              // false — south > north
isValidBBox([-10, -20, 100, 10, 20, -100])   // false — minAlt > maxAlt
isValidBBox(null)                            // false
```

# is3DBBox

## Signature

```js
is3DBBox (bbox)
```

## Description

Returns `true` if `bbox` is a valid GeoJSON bounding box with altitude coordinates (6 elements).

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `number[]` | yes | A valid GeoJSON bounding box |

## Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the bounding box has 6 coordinates |

## Throws

Throws if `bbox` is not a valid GeoJSON bounding box.

## Examples

```js
is3DBBox([-10, -20, -100, 10, 20, 100])  // true
is3DBBox([-10, -20, 10, 20])             // false
is3DBBox(null)                           // throws
```

# mergeBBox

## Signature

```js
mergeBBox (bbox1, bbox2)
```

## Description

Returns the smallest bounding box that encloses both input bounding boxes. Both inputs must be valid GeoJSON bounding boxes of the same dimensionality (2D or 3D).

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox1` | `number[]` | yes | A valid GeoJSON bounding box |
| `bbox2` | `number[]` | yes | A valid GeoJSON bounding box |

## Returns

| Type | Description |
|------|-------------|
| `number[]` | The merged bounding box |

## Throws

Throws if either input is not a valid GeoJSON bounding box.

## Examples

```js
mergeBBox([-10, -20, 10, 20], [-5, -15, 15, 25])
// [-10, -20, 15, 25]

mergeBBox([-10, -20, -100, 10, 20, 100], [-5, -15, -50, 15, 25, 200])
// [-10, -20, -100, 15, 25, 200]

mergeBBox([-180, -90, 0, 0], [0, 0, 180, 90])
// [-180, -90, 180, 90]

mergeBBox([2.3522, 48.8566, 2.3522, 48.8566], [2.3600, 48.8600, 2.3600, 48.8600])
// [2.3522, 48.8566, 2.3600, 48.8600]
```

## computeBBox

### Signature

```js
computeBBox (positions, options)
```

### Description

Computes the bounding box of an array of positions. If any position has an altitude coordinate, the result is a 3D bbox `[minX, minY, minZ, maxX, maxY, maxZ]`. Otherwise a 2D bbox `[minX, minY, maxX, maxY]` is returned. This behavior can be overridden with `ignore3D`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `positions` | `number[][]` | yes | A non-empty array of valid GeoJSON positions |
| `options` | `object` | no | Options |
| `options.ignore3D` | `boolean` | no | If `true`, altitude is ignored and a 2D bbox is always returned (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `number[]` | A 2D `[minX, minY, maxX, maxY]` or 3D `[minX, minY, minZ, maxX, maxY, maxZ]` bounding box |

### Throws

Throws if `positions` is empty, contains invalid positions, or if `options` is invalid.

### Examples

```js
computeBBox([[2.3522, 48.8566]])
// [2.3522, 48.8566, 2.3522, 48.8566]

computeBBox([[-10, -20], [10, 20], [0, 0]])
// [-10, -20, 10, 20]

computeBBox([[-10, -20, -100], [10, 20, 100]])
// [-10, -20, -100, 10, 20, 100]

computeBBox([[-10, -20, -100], [10, 20, 100]], { ignore3D: true })
// [-10, -20, 10, 20]
```