---
title: nvector
description: Spherical positions, vectors, and great-circle arcs.
---

# nvector

`nvector` represents a geographic point as a unit vector `[x, y, z]` on a sphere. Geographic positions are `[longitude, latitude]` in degrees. Angular inputs and results use radians.

```js
import { nvector } from '@kalisio/common-geospatial'
```

## Positions and vectors

| Signature | Parameters | Returns |
|---|---|---|
| `fromPosition(position)` | Longitude and latitude in degrees. Additional coordinates are ignored. | Unit vector. |
| `toPosition(vector)` | Unit vector. | Longitude and latitude in degrees. |
| `add(v1, v2)` | Two three-component vectors. | Component-wise sum. |
| `scale(vector, scalar)` | Three-component vector and numeric multiplier. | Scaled vector. |
| `dot(v1, v2)` | Two three-component vectors. | Scalar dot product. |
| `cross(v1, v2)` | Two three-component vectors. | Cross product vector. |
| `norm(vector)` | Three-component vector. | Euclidean length. |
| `normalize(vector)` | Nonzero three-component vector. | Unit vector with the same direction. |
| `angleBetween(v1, v2)` | Two nonzero three-component vectors. | Angle in radians, from 0 to π. |

## Directions and arcs

| Signature | Parameters | Returns |
|---|---|---|
| `north(origin)`, `east(origin)`, `south(origin)`, `west(origin)` | Unit vector away from the poles. | Cardinal direction in the local tangent plane. |
| `bearing(origin, bearing)` | Unit vector away from the poles and heading in radians clockwise from north. | Unit vector along the heading in the local tangent plane. |
| `destination(origin, bearing, angularDistance)` | Unit vector away from the poles, heading in radians clockwise from north, and angular distance in radians. | Unit vector at the destination. |
| `crossArcs(v1, v2, v3, v4, tolerance = 1e-12)` | Unit-vector endpoints for arcs `v1–v2` and `v3–v4`. The tolerance applies to degeneracy and side tests. | Boolean indicating a proper crossing. Endpoint touches and coincident arcs return `false`. |

## Example

```js
const origin = nvector.fromPosition([0, 0])
const destination = nvector.destination(origin, Math.PI / 2, Math.PI / 2)

nvector.toPosition(destination).map(Math.round) // [90, 0]
```
