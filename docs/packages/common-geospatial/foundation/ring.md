---
title: ring
description: Utilities for validating, processing and analyzing GeoJSON LinearRings.
---

# ring

A ring is an array of positions forming a GeoJSON LinearRing: at least 4 positions, closed so that the last position equals the first.

This module provides utilities for checking and enforcing ring closure, reducing coordinate precision, computing spherical orientation, and detecting intersections.

## isValidRing

### Signature

```js
isValidRing(ring, options = {})
```

### Description

Returns whether a value is a structurally valid LinearRing: an array of at least 4 valid positions that is closed.

This function checks structural validity only. It does not check for self-intersections or winding order.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `any` | yes | Value to test |
| `options.precision` | `number` | no | Number of decimal digits used for the closure check (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | When `true`, altitude is taken into account for the closure check (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a structurally valid ring |

### Examples

```js
isValidRing([[0, 0], [2, 0], [2, 1], [0, 0]]) // true
isValidRing([[0, 0], [2, 0], [0, 0]]) // false
isValidRing([[0, 0], [2, 0], [2, 1], [0, 1]]) // false
```

## isClosedRing

### Signature

```js
isClosedRing(ring, options = {})
```

### Description

Returns whether a ring is closed, i.e. whether its first and last positions are equal according to `isSamePosition()`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | An array of positions |
| `options.precision` | `number` | no | Number of decimal digits used for comparison (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | When `true`, altitude is taken into account (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the first and last positions are equal |

### Throws

Throws if `options` does not match the expected schema.

### Examples

```js
isClosedRing([[0, 0], [2, 0], [2, 1], [0, 0]]) // true
isClosedRing([[0, 0], [2, 0], [2, 1]]) // false
```

## closeRing

### Signature

```js
closeRing(ring, options = {})
```

### Description

Returns a closed ring.

If the ring is already closed, it is returned unchanged. Otherwise, a copy of the first position is appended to the ring.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | An array of positions |
| `options.precision` | `number` | no | Number of decimal digits used for the closure check |
| `options.consider3D` | `boolean` | no | When `true`, altitude is taken into account |

### Returns

| Type | Description |
|------|-------------|
| `Array` | The closed ring |

## truncateRing

### Signature

```js
truncateRing(ring, options = {})
```

### Description

Reduces the precision of all positions in a ring and ensures that the resulting ring is closed.

Consecutive duplicate positions produced by the precision reduction are removed automatically.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | An array of positions |
| `options.precision` | `number` | no | Decimal precision applied to coordinates |
| `options.consider3D` | `boolean` | no | When `true`, altitude is considered when removing duplicate positions |

### Returns

| Type | Description |
|------|-------------|
| `Array` | The processed and closed ring |

## sphericalRingArea

### Signature

```js
sphericalRingArea(ring)
```

### Description

Returns the signed spherical area of a ring, in steradians.

A positive area indicates counter-clockwise winding, while a negative area indicates clockwise winding.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | A valid closed ring |

### Returns

| Type | Description |
|------|-------------|
| `number` | Signed spherical area in steradians |

### Throws

Throws if `ring` is not a valid ring.

## isClockwiseRing

### Signature

```js
isClockwiseRing(ring)
```

### Description

Returns whether a ring is wound clockwise according to its signed spherical area.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | A valid closed ring |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the ring is clockwise |

## ringsIntersect

### Signature

```js
ringsIntersect(ring1, ring2)
```

### Description

Returns whether two rings intersect.

The edges of both rings are interpreted as great-circle arcs on the sphere and tested pairwise for intersection.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring1` | `Array` | yes | First valid closed ring |
| `ring2` | `Array` | yes | Second valid closed ring |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if at least one edge of `ring1` intersects an edge of `ring2` |

### Throws

Throws if either ring is not a valid closed ring.

## ringSelfIntersections

### Signature

```js
ringSelfIntersections(ring)
```

### Description

Finds intersections between non-adjacent edges of a ring.

Adjacent edges are ignored, including the first and last edges which meet at the closing position.

Each intersection is reported as a pair of edge indices. Edge `i` connects `ring[i]` to `ring[i + 1]`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | A valid closed ring |

### Returns

| Type | Description |
|------|-------------|
| `Array<Array<number>>` | Pairs of indices identifying intersecting edges |

### Throws

Throws if `ring` is not a valid closed ring.

### Examples

```js
ringSelfIntersections([
  [0, 0],
  [2, 2],
  [0, 2],
  [2, 0],
  [0, 0]
])
// [[0, 2]]

ringSelfIntersections([
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
  [0, 0]
])
// []
```
