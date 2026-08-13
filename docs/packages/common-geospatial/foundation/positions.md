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
]) // true

isValidPositions([
  [2.3522, 48.8566],
  [2.2945]
]) // false

isValidPositions([]) // true

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

| Name                 | Type      | Required | Description                                                                     |
| -------------------- | --------- | -------- | ------------------------------------------------------------------------------- |
| `positions`          | `Array`   | yes      | Collection of positions                                                         |
| `options.precision`  | `number`  | no       | Decimal precision used for comparison (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no       | Whether altitude is considered during comparison (default: `false`)             |

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
