---
title: convex-hull
description: Compute the convex hull of GeoJSON objects.
---

# convex-hull

## computeConvexHull

### Signature

```js
computeConvexHull (geoJson)
```

### Description

Computes the convex hull of any GeoJSON object. Accepts a plain geometry, a `Feature`, or a `FeatureCollection`. For a `FeatureCollection`, all positions from all features are aggregated before computing the hull. Features with a `null` geometry are silently ignored. Altitude values are always stripped — the hull is computed in 2D only.

The result type depends on the number and arrangement of extracted positions:

- 0 positions → `null`
- 1 position → `Point`
- 2 positions → `LineString`
- 3+ collinear positions → `LineString` between the first and last position
- 3+ non-collinear positions → `Polygon`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |

### Returns

| Type | Description |
|------|-------------|
| `object \| null` | A `Point`, `LineString`, or `Polygon` geometry, or `null` if no positions can be extracted |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

### Examples

```js
// Point — returns the point itself
computeConvexHull({ type: 'Point', coordinates: [2.349, 48.864] })
// { type: 'Point', coordinates: [2.349, 48.864] }
```

```js
// LineString with 2 points
computeConvexHull({
  type: 'LineString',
  coordinates: [[2.349, 48.864], [12.496, 41.902]]
})
// { type: 'LineString', coordinates: [[2.349, 48.864], [12.496, 41.902]] }
```

```js
// Collinear points — fallback to LineString between first and last
computeConvexHull({
  type: 'MultiPoint',
  coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]]
})
// { type: 'LineString', coordinates: [[0, 0], [3, 3]] }
```

```js
// Polygon — returns convex hull as a Polygon
computeConvexHull({
  type: 'Polygon',
  coordinates: [[
    [-4.795, 48.376], [2.551, 51.089], [8.233, 48.978],
    [7.440, 43.766], [3.159, 42.428], [-1.779, 43.363], [-4.795, 48.376]
  ]]
})
// { type: 'Polygon', coordinates: [[...]] }
```

```js
// 3D geometry — altitude is stripped, hull computed in 2D
computeConvexHull({
  type: 'LineString',
  coordinates: [[6.865, 45.832, 1034], [7.265, 45.923, 1224], [7.742, 45.921, 672], [7.315, 45.074, 250]]
})
// { type: 'Polygon', coordinates: [[...]] }  — 2D coordinates only
```

```js
// Feature
computeConvexHull({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.349, 48.864] },
  properties: { name: 'Paris' }
})
// { type: 'Point', coordinates: [2.349, 48.864] }
```

```js
// Feature with null geometry — returns null
computeConvexHull({ type: 'Feature', geometry: null, properties: {} })
// null
```

```js
// FeatureCollection — all positions aggregated
computeConvexHull({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [12.496, 41.902] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [28.979, 41.015] }, properties: {} }
  ]
})
// { type: 'Polygon', coordinates: [[...]] }
```

```js
// FeatureCollection with null geometries — ignored silently
computeConvexHull({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: {} },
    { type: 'Feature', geometry: null, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [12.496, 41.902] }, properties: {} }
  ]
})
// { type: 'LineString', coordinates: [[2.349, 48.864], [12.496, 41.902]] }
```

```js
// Empty FeatureCollection — returns null
computeConvexHull({ type: 'FeatureCollection', features: [] })
// null
```

```js
// FeatureCollection with collinear points — fallback to LineString
computeConvexHull({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2, 2] }, properties: {} }
  ]
})
// { type: 'LineString', coordinates: [[0, 0], [2, 2]] }
```
