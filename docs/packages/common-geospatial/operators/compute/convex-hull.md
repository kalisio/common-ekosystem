---
title: convex-hull
description: Compute the convex hull of GeoJSON objects.
---

# convex-hull

## computeGeometryConvexHull

### Signature

```js
computeGeometryConvexHull (geometry)
```

### Description

Computes the convex hull of a GeoJSON geometry. The result type depends on the number and arrangement of positions extracted from the geometry — altitude values are always stripped and the hull is computed in 2D only.

- 0 positions → `null`
- 1 position → `Point`
- 2 positions → `LineString`
- 3+ collinear positions → `LineString` between the first and last position
- 3+ non-collinear positions → `Polygon`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geometry` | `object` | yes | A GeoJSON geometry object |

### Returns

| Type | Description |
|------|-------------|
| `object \| null` | A `Point`, `LineString`, or `Polygon` geometry, or `null` if no positions can be extracted |

### Throws

Throws if `geometry` is not a valid GeoJSON geometry object.

### Examples

```js
// Point — returns the point itself
computeGeometryConvexHull({ type: 'Point', coordinates: [2.349, 48.864] })
// { type: 'Point', coordinates: [2.349, 48.864] }
```

```js
// LineString with 2 points
computeGeometryConvexHull({
  type: 'LineString',
  coordinates: [[2.349, 48.864], [12.496, 41.902]]
})
// { type: 'LineString', coordinates: [[2.349, 48.864], [12.496, 41.902]] }
```

```js
// Collinear points — fallback to LineString between first and last
computeGeometryConvexHull({
  type: 'MultiPoint',
  coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]]
})
// { type: 'LineString', coordinates: [[0, 0], [3, 3]] }
```

```js
// Polygon — returns convex hull as a Polygon
computeGeometryConvexHull({
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
computeGeometryConvexHull({
  type: 'LineString',
  coordinates: [[6.865, 45.832, 1034], [7.265, 45.923, 1224], [7.742, 45.921, 672], [7.315, 45.074, 250]]
})
// { type: 'Polygon', coordinates: [[...]] }  — 2D coordinates only
```

```js
// GeometryCollection — all geometries are merged before computing the hull
computeGeometryConvexHull({
  type: 'GeometryCollection',
  geometries: [
    { type: 'Point', coordinates: [2.349, 48.864] },
    { type: 'LineString', coordinates: [[-50, 20], [30, 60]] }
  ]
})
// { type: 'Polygon', coordinates: [[...]] }
```

---

## computeGeoJsonConvexHull

### Signature

```js
computeGeoJsonConvexHull (geoJson)
```

### Description

Computes the convex hull of any GeoJSON object. Accepts a plain geometry, a `Feature`, or a `FeatureCollection`. For a `FeatureCollection`, all positions from all features are aggregated before computing the hull. Features with a `null` geometry are silently ignored. Returns `null` if no positions can be extracted.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |

### Returns

| Type | Description |
|------|-------------|
| `object \| null` | A `Point`, `LineString`, or `Polygon` geometry, or `null` if no positions are available |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

### Examples

```js
// Plain geometry
computeGeoJsonConvexHull({
  type: 'Polygon',
  coordinates: [[[-4.795, 48.376], [2.551, 51.089], [8.233, 48.978], [7.440, 43.766], [-4.795, 48.376]]]
})
// { type: 'Polygon', coordinates: [[...]] }
```

```js
// Feature
computeGeoJsonConvexHull({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.349, 48.864] },
  properties: { name: 'Paris' }
})
// { type: 'Point', coordinates: [2.349, 48.864] }
```

```js
// Feature with null geometry — returns null
computeGeoJsonConvexHull({ type: 'Feature', geometry: null, properties: {} })
// null
```

```js
// FeatureCollection — all positions aggregated
computeGeoJsonConvexHull({
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
computeGeoJsonConvexHull({
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
computeGeoJsonConvexHull({ type: 'FeatureCollection', features: [] })
// null
```

```js
// FeatureCollection with collinear points — fallback to LineString
computeGeoJsonConvexHull({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2, 2] }, properties: {} }
  ]
})
// { type: 'LineString', coordinates: [[0, 0], [2, 2]] }
```