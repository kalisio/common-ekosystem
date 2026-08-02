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