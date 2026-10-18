---
title: positions
description: Utilities for validating and processing collections of GeoJSON positions.
---

# positions

A collection of positions is an array of valid GeoJSON positions.

This module provides utilities to validate, deduplicate, truncate and reproject collections of positions.

## isValidPositions

### Signature

```js
isValidPositions(positions)
```

### Description

Returns whether a value is an array whose elements are all valid positions.

An empty array is considered valid.

### Parameters

| Name        | Type  | Required | Description   |
| ----------- | ----- | -------- | ------------- |
| `positions` | `any` | yes      | Value to test |

### Returns

| Type      | Description                                        |
| --------- | -------------------------------------------------- |
| `boolean` | `true` if the value is an array of valid positions |

### Examples

```js
isValidPositions([
  [2.3522, 48.8566],
  [2.2945, 48.8584]
])
// true

isValidPositions([
  [2.3522, 48.8566],
  [2.2945]
])
// false

isValidPositions([])
// true
```

## deduplicatePositions

### Signature

```js
deduplicatePositions(positions, options = {})
```

### Description

Removes consecutive duplicate positions from a collection.

Two consecutive positions are considered identical according to `isSamePosition()`. The first occurrence is preserved and subsequent consecutive duplicates are discarded.

Only adjacent duplicates are removed; identical positions separated by other positions are left unchanged.

### Parameters

| Name                 | Type      | Required | Description                                                                       |
| -------------------- | --------- | -------- | --------------------------------------------------------------------------------- |
| `positions`          | `Array`   | yes      | Collection of positions                                                           |
| `options.precision`  | `number`  | no       | Decimal precision used for comparison. Defaults to `DEFAULT_COORDINATE_PRECISION` |
| `options.consider3D` | `boolean` | no       | Whether altitude is considered during comparison. Defaults to `false`             |

### Returns

| Type    | Description                                     |
| ------- | ----------------------------------------------- |
| `Array` | A new array with consecutive duplicates removed |

### Throws

Throws if `options` does not match the expected schema.

### Examples

```js
deduplicatePositions([
  [0, 0],
  [0, 0],
  [1, 1],
  [1, 1],
  [2, 2]
])
// [[0, 0], [1, 1], [2, 2]]
```

## truncatePositions

### Signature

```js
truncatePositions(positions, options = {})
```

### Description

Truncates every coordinate of every position to the requested precision.

Each position is truncated using `truncatePosition()`. Because `truncatePosition()` mutates its input, the positions contained in the input array are modified in place.

Consecutive duplicate positions can optionally be removed after truncation.

### Parameters

| Name                  | Type      | Required | Description                                                                  |
| --------------------- | --------- | -------- | ---------------------------------------------------------------------------- |
| `positions`           | `Array`   | yes      | Collection of positions                                                      |
| `options.precision`   | `number`  | no       | Number of decimal places. Defaults to `DEFAULT_COORDINATE_PRECISION`         |
| `options.deduplicate` | `boolean` | no       | Remove consecutive duplicate positions after truncation. Defaults to `false` |
| `options.consider3D`  | `boolean` | no       | Consider altitude when deduplicating. Defaults to `false`                    |

### Returns

| Type    | Description                  |
| ------- | ---------------------------- |
| `Array` | Array of truncated positions |

### Throws

Throws if `positions` is not an array or if `options` does not match the expected schema.

### Examples

```js
truncatePositions([
  [2.3522345, 48.8566789],
  [2.3522456, 48.8566891]
], { precision: 3 })
// [[2.352, 48.856], [2.352, 48.856]]
```

```js
truncatePositions([
  [2.3522345, 48.8566789],
  [2.3522456, 48.8566891]
], { precision: 3, deduplicate: true })
// [[2.352, 48.856]]
```

## reprojectPositions

### Signature

```js
reprojectPositions(positions, source, target = WGS84)
```

### Description

Reprojects an array of 2D or 3D positions from a source projection to a target projection using `reprojectPosition()`.

The target projection defaults to WGS84 (`EPSG:4326`). Both projections must already be registered.

When source and target projections are identical, the function returns a new array containing copies of the original positions, without performing any transformation or individual position validation.

An empty array is accepted and returns an empty array.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `positions` | `Array` | yes | Collection of positions |
| `source` | `string` | yes | Source projection name |
| `target` | `string` | no | Target projection name (defaults to WGS84) |

### Returns

| Type | Description |
|------|-------------|
| `Array` | A new array containing the reprojected positions |

### Throws

Throws if `positions` is not an array or if either projection is not registered.

When source and target projections differ, also throws if any position is invalid.

### Examples

```js
reprojectPositions([
  [2.3522, 48.8566],
  [2.2945, 48.8584]
], 'EPSG:4326', 'EPSG:3857')
// Array of projected positions in Web Mercator

reprojectPositions([
  [261845.7, 6250564.3],
  [255422.6, 6250868.6]
], 'EPSG:3857')
// Array of geographic positions in WGS84

reprojectPositions([
  [2.3522, 48.8566],
  [2.2945, 48.8584, 100]
], 'EPSG:4326', 'EPSG:4326')
// [[2.3522, 48.8566], [2.2945, 48.8584, 100]]

reprojectPositions([], 'EPSG:3857')
// []
```
