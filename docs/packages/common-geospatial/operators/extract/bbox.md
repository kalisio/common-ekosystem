---
title: bbox
description: Extract the bounding box declared by a GeoJSON object.
---

# bbox

## extractBBox

### Signature

```js
extractBBox (geoJson)
```

### Description

Extracts the `bbox` member declared by a GeoJSON object.

The bounding box is returned as stored in the GeoJSON object. No bounding box is computed when the `bbox` member is absent; in that case, `undefined` is returned.

Use `computeGeoJsonBoundingBox` when a bounding box must be computed from the coordinates of a GeoJSON object.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |

### Returns

| Type | Description |
|------|-------------|
| `number[] \| undefined` | The declared bounding box, or `undefined` if no `bbox` member is present |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

### Examples

```js
// 2D bbox
extractBBox({
  type: 'Point',
  coordinates: [2.349, 48.864],
  bbox: [2.349, 48.864, 2.349, 48.864]
})
// [2.349, 48.864, 2.349, 48.864]
```

```js
// 3D bbox
extractBBox({
  type: 'Point',
  coordinates: [2.349, 48.864, 100],
  bbox: [2.349, 48.864, 100, 2.349, 48.864, 100]
})
// [2.349, 48.864, 100, 2.349, 48.864, 100]
```

```js
// No declared bbox
extractBBox({
  type: 'LineString',
  coordinates: [[2.349, 48.864], [4.835, 45.764]]
})
// undefined
```