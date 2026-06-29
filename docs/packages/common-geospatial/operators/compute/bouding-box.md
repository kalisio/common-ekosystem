---
title: bounding-box
description: Compute the bounding box of GeoJSON objects.
---

# bounding-box

## computeGeometryBoundingBox

### Signature

```js
computeGeometryBoundingBox (geometry, options)
```

### Description

Computes the bounding box of a GeoJSON geometry as a flat coordinate array `[west, south, east, north]` in 2D, or `[west, south, minAlt, east, north, maxAlt]` in 3D. The 3D form is produced automatically when at least one position carries an altitude value. All geometry types are supported, including `GeometryCollection`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geometry` | `object` | yes | A GeoJSON geometry object |
| `options.ignore3D` | `boolean` | no | If `true`, altitude values are ignored and a 2D bbox is always returned (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `number[]` | A 2D bbox `[west, south, east, north]` or 3D bbox `[west, south, minAlt, east, north, maxAlt]` |

### Throws

Throws if `geometry` is not a valid GeoJSON geometry object.
Throws if `options` does not match the expected schema.

### Examples

```js
// Point
computeGeometryBoundingBox({ type: 'Point', coordinates: [2.349, 48.864] })
// [2.349, 48.864, 2.349, 48.864]
```

```js
// LineString
computeGeometryBoundingBox({
  type: 'LineString',
  coordinates: [[-73.985, 40.748], [-87.623, 41.881], [-118.243, 34.052]]
})
// [-118.243, 34.052, -73.985, 41.881]
```

```js
// Polygon with hole — hole coordinates are included in the bbox
computeGeometryBoundingBox({
  type: 'Polygon',
  coordinates: [
    [[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]],
    [[-5, -5], [5, -5], [5, 5], [-5, 5], [-5, -5]]
  ]
})
// [-10, -10, 10, 10]
```

```js
// 3D LineString — altitude range included automatically
computeGeometryBoundingBox({
  type: 'LineString',
  coordinates: [[6.865, 45.832, 1034], [7.742, 45.921, 672], [7.315, 45.074, 250]]
})
// [6.865, 45.074, 250, 7.742, 45.832, 1034]
```

```js
// Ignore altitude
computeGeometryBoundingBox(
  {
    type: 'LineString',
    coordinates: [[6.865, 45.832, 1034], [7.742, 45.921, 672], [7.315, 45.074, 250]]
  },
  { ignore3D: true }
)
// [6.865, 45.074, 7.742, 45.832]
```

```js
// GeometryCollection
computeGeometryBoundingBox({
  type: 'GeometryCollection',
  geometries: [
    { type: 'Point', coordinates: [2.349, 48.864] },
    { type: 'LineString', coordinates: [[-50, 20], [30, 60]] }
  ]
})
// [-50, 20, 30, 60]
```

---

## computeGeoJsonBoundingBox

### Signature

```js
computeGeoJsonBoundingBox (geoJson, options)
```

### Description

Computes the bounding box of any GeoJSON object as a flat coordinate array `[west, south, east, north]` in 2D, or `[west, south, minAlt, east, north, maxAlt]` in 3D. Accepts a plain geometry, a `Feature`, or a `FeatureCollection`. Features with a `null` geometry are silently ignored. Returns `null` if no positions can be extracted (empty `FeatureCollection`, `Feature` with `null` geometry).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |
| `options.ignore3D` | `boolean` | no | If `true`, altitude values are ignored and a 2D bbox is always returned (default: `false`) |

### Returns

| Type | Description |
|------|-------------|
| `number[] \| null` | A 2D bbox `[west, south, east, north]`, a 3D bbox `[west, south, minAlt, east, north, maxAlt]`, or `null` if no positions are available |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.
Throws if `options` does not match the expected schema.

### Examples

```js
// Plain geometry
computeGeoJsonBoundingBox({
  type: 'Polygon',
  coordinates: [[[-4.795, 48.376], [2.551, 51.089], [8.233, 48.978], [7.440, 43.766], [-4.795, 48.376]]]
})
// [-4.795, 43.766, 8.233, 51.089]
```

```js
// Feature
computeGeoJsonBoundingBox({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.349, 48.864] },
  properties: { name: 'Paris' }
})
// [2.349, 48.864, 2.349, 48.864]
```

```js
// Feature with null geometry — returns null
computeGeoJsonBoundingBox({ type: 'Feature', geometry: null, properties: {} })
// null
```

```js
// FeatureCollection
computeGeoJsonBoundingBox({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [28.979, 41.015] }, properties: {} }
  ]
})
// [2.349, 41.015, 28.979, 48.864]
```

```js
// Empty FeatureCollection — returns null
computeGeoJsonBoundingBox({ type: 'FeatureCollection', features: [] })
// null
```

```js
// FeatureCollection with null geometry — null features are ignored
computeGeoJsonBoundingBox({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [2.349, 48.864] }, properties: {} },
    { type: 'Feature', geometry: null, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [12.496, 41.902] }, properties: {} }
  ]
})
// [2.349, 41.902, 12.496, 48.864]
```

```js
// 3D FeatureCollection
computeGeoJsonBoundingBox({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0, 100] }, properties: {} },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[5, 5, 500], [10, 10, 200]] }, properties: {} }
  ]
})
// [0, 0, 100, 10, 10, 500]
```

```js
// Ignore altitude on a FeatureCollection
computeGeoJsonBoundingBox(
  {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0, 100] }, properties: {} },
      { type: 'Feature', geometry: { type: 'LineString', coordinates: [[5, 5, 500], [10, 10, 200]] }, properties: {} }
    ]
  },
  { ignore3D: true }
)
// [0, 0, 10, 10]
```