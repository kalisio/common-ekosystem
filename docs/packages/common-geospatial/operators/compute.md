---
title: compute
description: Compute derived information from GeoJSON objects.
---

# compute

This module provides operators to compute derived information from GeoJSON objects.

## computeGeoJsonBoundingBox

### Signature

```js
computeGeoJsonBoundingBox (geoJson, options)
```

### Description

Computes the bounding box of any GeoJSON object as a flat coordinate array `[west, south, east, north]` in 2D, or `[west, south, minAlt, east, north, maxAlt]` in 3D.

Accepts a plain geometry, a `Feature`, or a `FeatureCollection`. Features with a `null` geometry are silently ignored.

The 3D form is produced automatically when at least one position carries an altitude value. Returns `null` if no positions can be extracted.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object |
| `options.ignore3D` | `boolean` | no | If `true`, altitude values are ignored and a 2D bbox is always returned. Defaults to `false` |

### Returns

| Type | Description |
|------|-------------|
| `number[] \| null` | A 2D bbox `[west, south, east, north]`, a 3D bbox `[west, south, minAlt, east, north, maxAlt]`, or `null` if no positions are available |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

Throws if `options` does not match the expected schema.

### Examples

```js
// Point
computeGeoJsonBoundingBox({
  type: 'Point',
  coordinates: [2.349, 48.864]
})
// [2.349, 48.864, 2.349, 48.864]
```

```js
// LineString
computeGeoJsonBoundingBox({
  type: 'LineString',
  coordinates: [
    [-73.985, 40.748],
    [-87.623, 41.881],
    [-118.243, 34.052]
  ]
})
// [-118.243, 34.052, -73.985, 41.881]
```

```js
// Polygon with hole — hole coordinates are included in the bbox
computeGeoJsonBoundingBox({
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
computeGeoJsonBoundingBox({
  type: 'LineString',
  coordinates: [
    [6.865, 45.832, 1034],
    [7.742, 45.921, 672],
    [7.315, 45.074, 250]
  ]
})
// [6.865, 45.074, 250, 7.742, 45.832, 1034]
```

```js
// Ignore altitude
computeGeoJsonBoundingBox(
  {
    type: 'LineString',
    coordinates: [
      [6.865, 45.832, 1034],
      [7.742, 45.921, 672],
      [7.315, 45.074, 250]
    ]
  },
  { ignore3D: true }
)
// [6.865, 45.074, 7.742, 45.832]
```

```js
// Feature
computeGeoJsonBoundingBox({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.349, 48.864]
  },
  properties: { name: 'Paris' }
})
// [2.349, 48.864, 2.349, 48.864]
```

```js
// Feature with null geometry
computeGeoJsonBoundingBox({
  type: 'Feature',
  geometry: null,
  properties: {}
})
// null
```

```js
// FeatureCollection
computeGeoJsonBoundingBox({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.349, 48.864] },
      properties: {}
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [28.979, 41.015] },
      properties: {}
    }
  ]
})
// [2.349, 41.015, 28.979, 48.864]
```

```js
// FeatureCollection with null geometries — ignored silently
computeGeoJsonBoundingBox({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.349, 48.864] },
      properties: {}
    },
    {
      type: 'Feature',
      geometry: null,
      properties: {}
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [12.496, 41.902] },
      properties: {}
    }
  ]
})
// [2.349, 41.902, 12.496, 48.864]
```

```js
// Empty FeatureCollection
computeGeoJsonBoundingBox({
  type: 'FeatureCollection',
  features: []
})
// null
```

```js
// 3D FeatureCollection
computeGeoJsonBoundingBox({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0, 100] },
      properties: {}
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[5, 5, 500], [10, 10, 200]]
      },
      properties: {}
    }
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
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0, 100] },
        properties: {}
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[5, 5, 500], [10, 10, 200]]
        },
        properties: {}
      }
    ]
  },
  { ignore3D: true }
)
// [0, 0, 10, 10]
```

## computeGeoJsonConvexHull

### Signature

```js
computeGeoJsonConvexHull (geoJson)
```

### Description

Computes the 2D convex hull of a GeoJSON object from all its positions.

Altitude values are ignored. The returned geometry depends on the number and spatial distribution of the extracted positions:

- no position → `null`
- one position → `Point`
- two positions → `LineString`
- three or more positions → `Polygon` when a convex hull can be computed
- collinear positions → `LineString`

If a `Feature` has a `null` geometry, `null` is returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object |

### Returns

| Type | Description |
|------|-------------|
| `Point \| LineString \| Polygon \| null` | The convex hull geometry, or `null` if no positions are available |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

### Examples

```js
// Point
computeGeoJsonConvexHull({
  type: 'Point',
  coordinates: [2.349, 48.864]
})
// { type: 'Point', coordinates: [2.349, 48.864] }
```

```js
// Two positions
computeGeoJsonConvexHull({
  type: 'MultiPoint',
  coordinates: [[2.349, 48.864], [4.835, 45.764]]
})
// {
//   type: 'LineString',
//   coordinates: [[2.349, 48.864], [4.835, 45.764]]
// }
```

```js
// Polygon hull
computeGeoJsonConvexHull({
  type: 'MultiPoint',
  coordinates: [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [5, 5]
  ]
})
// {
//   type: 'Polygon',
//   coordinates: [
//     [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
//   ]
// }
```

```js
// Collinear positions
computeGeoJsonConvexHull({
  type: 'MultiPoint',
  coordinates: [[0, 0], [5, 5], [10, 10]]
})
// {
//   type: 'LineString',
//   coordinates: [[0, 0], [10, 10]]
// }
```

```js
// Feature with null geometry
computeGeoJsonConvexHull({
  type: 'Feature',
  geometry: null,
  properties: {}
})
// null
```

```js
// Altitude values are ignored
computeGeoJsonConvexHull({
  type: 'MultiPoint',
  coordinates: [
    [0, 0, 100],
    [10, 0, 200],
    [0, 10, 300]
  ]
})
// {
//   type: 'Polygon',
//   coordinates: [
//     [[0, 0], [10, 0], [0, 10], [0, 0]]
//   ]
// }
```