---
title: positions
description: Utilities for validating and processing collections of GeoJSON positions.
---

# positions

A collection of positions is a non-empty array of valid GeoJSON positions.

This module provides utilities to validate collections of positions and remove consecutive duplicate positions.

## isValidPositions

### Signature

```js
isValidPositions(positions)
```

### Description

Returns whether a value is a valid collection of positions.

A valid collection is a non-empty array whose elements are all valid GeoJSON positions.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `positions` | `any` | yes | Value to test |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid collection of positions |

### Examples

```js
isValidPositions([
  [2.3522, 48.8566],
  [2.2945, 48.8584]
]) // true

isValidPositions([
  [2.3522, 48.8566],
  [181, 48.8566]
]) // false

isValidPositions([]) // false

isValidPositions('Paris') // false
```

---

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

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `positions` | `Array` | yes | Collection of positions |
| `options.precision` | `number` | no | Decimal precision used for comparison (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | Whether altitude is considered during comparison (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
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

// [
//   [0, 0],
//   [1, 1],
//   [2, 2]
// ]
```

```js
deduplicatePositions([
  [0, 0],
  [1, 1],
  [0, 0]
])

// [
//   [0, 0],
//   [1, 1],
//   [0, 0]
// ]
```

```js
deduplicatePositions(
  [
    [2.3522, 48.8566, 100],
    [2.3522, 48.8566, 200]
  ],
  { consider3D: true }
)

// [
//   [2.3522, 48.8566, 100],
//   [2.3522, 48.8566, 200]
// ]
```

::: tip
`deduplicatePositions()` only removes **consecutive** duplicates. If you need to remove all duplicate positions regardless of their location in the collection, use a different algorithm based on hashing or indexing.
:::

## transformPositions

### Signature

```js
transformPositions(positions, source, target)
```

### Description

Transforms a collection of coordinate tuples from one coordinate reference system (CRS) to another.

The source and target projections must be registered beforehand using `defineProjection()`. Each position is transformed independently, preserving the order of the collection.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `positions` | `Array` | yes | A non-empty array of coordinate tuples |
| `source` | `string` | yes | Source projection name |
| `target` | `string` | yes | Target projection name |

### Returns

| Type | Description |
|------|-------------|
| `Array` | A new array containing the transformed coordinate tuples |

### Throws

Throws if:

- `positions` is not a non-empty array;
- `source` is not a registered projection;
- `target` is not a registered projection;
- any position in the collection is invalid.

### Examples

```js
transformPositions(
  [
    [2.3522, 48.8566],
    [2.2945, 48.8584]
  ],
  'EPSG:4326',
  'EPSG:3857'
)

// [
//   [261845.7..., 6250564.3...],
//   [255422.5..., 6250835.1...]
// ]
```
