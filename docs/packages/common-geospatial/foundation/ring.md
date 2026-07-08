---
title: ring
description: Primitives operating on a LinearRing — deduplication, closure, structural validity and spherical area.
---

# ring

A ring is an array of positions forming a LinearRing: at least 4 positions, closed (its last position equals its first). These primitives
operate on such arrays. Structural validity is checked here; topological validity (self-intersection, winding correctness) is the
responsibility of the `validate` operator.

## deduplicateRingPositions

### Signature

```js
deduplicateRingPositions(ring, options = {})
```

### Description

Returns a new ring with positions equal to their immediate predecessor removed. Comparison is done at the given precision, following
`isSamePosition`. Only consecutive duplicates are removed: a position equal to an earlier, non-adjacent one is kept. This function does
not re-close the ring — if deduplication drops the closing position, re-close with `closeRing`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | An array of positions |
| `options.precision` | `number` | no | Number of decimal digits used for comparison (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | When `true`, altitude is taken into account (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `Array` | A new ring without consecutive duplicate positions |

### Throws

Throws if `options` does not match the expected schema.

### Examples

```js
deduplicateRingPositions([[0, 0], [0, 0], [2, 0], [2, 1], [0, 0]])
// [[0, 0], [2, 0], [2, 1], [0, 0]]

deduplicateRingPositions([[0, 0], [2, 0], [0, 0], [2, 1]])
// [[0, 0], [2, 0], [0, 0], [2, 1]] — non-consecutive duplicates are kept
```

## isClosedRing

### Signature

```js
isClosedRing(ring, options = {})
```

### Description

Returns whether a ring is closed, i.e. its last position equals its first at the given precision.

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
isClosedRing([[0, 0], [2, 0], [2, 1], [0, 0]])   // true
isClosedRing([[0, 0], [2, 0], [2, 1]])           // false
```

## closeRing

### Signature

```js
closeRing(ring, options = {})
```

### Description

Returns a closed ring. If the ring is already closed it is returned unchanged; otherwise a copy of the first position is
appended. The appended position is a clone, so the first and last positions are not the same reference.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | An array of positions |
| `options.precision` | `number` | no | Number of decimal digits used for comparison (default: `DEFAULT_COORDINATE_PRECISION`) |
| `options.consider3D` | `boolean` | no | When `true`, altitude is taken into account (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `Array` | The ring, closed |

### Examples

```js
closeRing([[0, 0], [2, 0], [2, 1]])
// [[0, 0], [2, 0], [2, 1], [0, 0]]

closeRing([[0, 0], [2, 0], [2, 1], [0, 0]])
// unchanged
```

## isValidRing

### Signature

```js
isValidRing(ring, options = {})
```

### Description

Returns whether a value is a structurally valid LinearRing: an array of at least 4 valid positions that is closed.
This does not check topology (self-intersection, winding order) — that is the responsibility of the `validate` operator.

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
isValidRing([[0, 0], [2, 0], [2, 1], [0, 0]])   // true
isValidRing([[0, 0], [2, 0], [0, 0]])           // false — fewer than 4 positions
isValidRing([[0, 0], [2, 0], [2, 1], [0, 1]])   // false — not closed
```

## sphericalRingArea

### Signature

```js
sphericalRingArea(ring)
```

### Description

Returns the signed spherical area of a ring, in steradians. A positive area means the ring is wound counter-clockwise,
a negative area means clockwise.

This uses spherical geometry, not planar. On large polygons spanning several degrees, spherical winding can disagree
with planar winding — a difference that planar tools cannot detect. This is the orientation MongoDB's `2dsphere`
index (S2) reasons about.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | A valid closed ring |

### Returns

| Type | Description |
|------|-------------|
| `number` | Signed area in steradians (positive: counter-clockwise, negative: clockwise) |

### Throws

Throws if `ring` is not a valid ring.

### Examples

```js
sphericalRingArea([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])   // > 0 (counter-clockwise)
sphericalRingArea([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])   // < 0 (clockwise)
```

## isClockwiseRing

### Signature

```js
isClockwiseRing(ring)
```

### Description

Returns whether a ring is wound clockwise, i.e. its signed spherical area is negative.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ring` | `Array` | yes | A valid closed ring |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the ring is clockwise |

### Throws

Throws if `ring` is not a valid ring.

### Examples

```js
isClockwiseRing([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]])   // true
isClockwiseRing([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]])   // false
```