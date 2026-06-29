---
title: simplify
description: Simplify the coordinates of GeoJSON objects using the Visvalingam-Whyatt algorithm.
---

# simplify

## simplifyGeoJson

### Signature

```js
simplifyGeoJson (geoJson, options)
```

### Description

Simplifies all coordinate sequences of any GeoJSON object using the Visvalingam-Whyatt algorithm. Accepts a plain geometry, a `Feature`, or a `FeatureCollection`. Supports `LineString`, `Polygon`, `MultiLineString`, `MultiPolygon`, and `GeometryCollection`. `Point` and `MultiPoint` geometries are left unchanged. Features with a `null` geometry are skipped silently. The operation is performed **in place** — the original object is mutated and returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |
| `options.tolerance` | `number` | no | Minimum triangle area threshold below which a point is removed (default: `0`) |
| `options.getWeight` | `function` | no | A function `(coord, index) => number` that returns a weight multiplied by the triangle area of each point. Defaults to `() => 1` (no weighting) |

### Returns

| Type | Description |
|------|-------------|
| `object` | The mutated GeoJSON object |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.
Throws if `options` does not match the expected schema.

### Examples

```js
// LineString
simplifyGeoJson(
  { type: 'LineString', coordinates: [[0,0],[1,0.01],[2,0.02],[3,0.01],[4,0]] },
  { tolerance: 1e-4 }
)
// { type: 'LineString', coordinates: [[0,0],[4,0]] }
```

```js
// Polygon — each ring is simplified independently
simplifyGeoJson(
  { type: 'Polygon', coordinates: [[[0,0],[1,0.01],[2,0],[3,0.01],[4,0],[2,-1],[0,0]]] },
  { tolerance: 1e-4 }
)
// { type: 'Polygon', coordinates: [[[0,0],[4,0],[2,-1],[0,0]]] }
```

```js
// GeometryCollection — recurses into each geometry
simplifyGeoJson(
  {
    type: 'GeometryCollection',
    geometries: [
      { type: 'LineString', coordinates: [[0,0],[1,0.01],[2,0]] },
      { type: 'LineString', coordinates: [[3,0],[4,0.01],[5,0]] }
    ]
  },
  { tolerance: 1e-4 }
)
// {
//   type: 'GeometryCollection',
//   geometries: [
//     { type: 'LineString', coordinates: [[0,0],[2,0]] },
//     { type: 'LineString', coordinates: [[3,0],[5,0]] }
//   ]
// }
```

```js
// Point — returned unchanged
simplifyGeoJson({ type: 'Point', coordinates: [2.3522, 48.8566] }, { tolerance: 1e-4 })
// { type: 'Point', coordinates: [2.3522, 48.8566] }
```

```js
// Feature
simplifyGeoJson(
  {
    type: 'Feature',
    properties: { name: 'Route' },
    geometry: { type: 'LineString', coordinates: [[0,0],[1,0.01],[2,0.02],[3,0.01],[4,0]] }
  },
  { tolerance: 1e-4 }
)
// {
//   type: 'Feature',
//   properties: { name: 'Route' },
//   geometry: { type: 'LineString', coordinates: [[0,0],[4,0]] }
// }
```

```js
// Feature with null geometry — skipped silently
simplifyGeoJson({ type: 'Feature', geometry: null, properties: {} }, { tolerance: 1e-4 })
// { type: 'Feature', geometry: null, properties: {} }
```

```js
// FeatureCollection
simplifyGeoJson(
  {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0,0],[1,0.01],[2,0]] } },
      { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[3,0],[4,0.01],[5,0]] } }
    ]
  },
  { tolerance: 1e-4 }
)
// {
//   type: 'FeatureCollection',
//   features: [
//     { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0,0],[2,0]] } },
//     { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[3,0],[5,0]] } }
//   ]
// }
```

```js
// Custom weight — preserve points of interest regardless of their area
simplifyGeoJson(
  { type: 'LineString', coordinates: [[0,0],[1,0.01],[2,0.01],[3,0.01],[4,0]] },
  {
    tolerance: 1e-4,
    getWeight: (coord) => coord[0] === 2 ? 1e10 : 1
  }
)
// { type: 'LineString', coordinates: [[0,0],[2,0.01],[4,0]] }
```

```js
// Mutates in place
const geoJson = {
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: [[0,0],[1,0.01],[2,0]] },
  properties: {}
}
const result = simplifyGeoJson(geoJson, { tolerance: 1e-4 })
result === geoJson // true
```