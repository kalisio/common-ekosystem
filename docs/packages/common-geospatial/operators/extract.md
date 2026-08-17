---
title: extract
description: Extract information from GeoJSON objects.
---

# extract

This module provides operators to extract information from GeoJSON objects.

## extractGeoJsonNode

### Signature

```js
extractGeoJsonNode (geoJson, path)
```

### Description

Extracts the node reachable through a dot-separated path within a GeoJSON object. 
The path can traverse both object properties and array indexes.

Returns `undefined` if the path cannot be resolved.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object |
| `path` | `string` | yes | Dot-separated path to the node |

### Returns

| Type | Description |
|------|-------------|
| `* \| undefined` | The node found at `path`, or `undefined` if the path cannot be resolved |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

Throws if `path` is not a non-empty string.

### Examples

```js
extractGeoJsonNode({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.349, 48.864] },
  properties: { name: 'Paris' }
}, 'properties.name')
// 'Paris'
```

```js
extractGeoJsonNode({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.349, 48.864] },
      properties: { name: 'Paris' }
    }
  ]
}, 'features.0.properties.name')
// 'Paris'
```

```js
extractGeoJsonNode({
  type: 'Point',
  coordinates: [2.349, 48.864]
}, 'coordinates.1')
// 48.864
```

```js
extractGeoJsonNode({
  type: 'Feature',
  geometry: null,
  properties: {}
}, 'properties.name')
// undefined
```

## extractGeoJsonBBox

### Signature

```js
extractGeoJsonBBox (geoJson)
```

### Description

Extracts the `bbox` member declared by a GeoJSON object.

The bounding box is returned as stored in the GeoJSON object. No bounding box is 
computed when the `bbox` member is absent; in that case, `undefined` is returned.

Use `computeGeoJsonBoundingBox` when a bounding box must be computed from the 
coordinates of a GeoJSON object.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object |

### Returns

| Type | Description |
|------|-------------|
| `number[] \| undefined` | The declared bounding box, or `undefined` if no `bbox` member is present |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

### Examples

```js
// 2D bbox
extractGeoJsonBBox({
  type: 'Point',
  coordinates: [2.349, 48.864],
  bbox: [2.349, 48.864, 2.349, 48.864]
})
// [2.349, 48.864, 2.349, 48.864]
```

```js
// 3D bbox
extractGeoJsonBBox({
  type: 'Point',
  coordinates: [2.349, 48.864, 100],
  bbox: [2.349, 48.864, 100, 2.349, 48.864, 100]
})
// [2.349, 48.864, 100, 2.349, 48.864, 100]
```

```js
// No declared bbox
extractGeoJsonBBox({
  type: 'LineString',
  coordinates: [[2.349, 48.864], [4.835, 45.764]]
})
// undefined
```

## extractGeoJsonCRS

### Signature

```js
extractGeoJsonCRS (geoJson)
```

### Description

Extracts and resolves the coordinate reference system (CRS) declared by a GeoJSON object.

When no `crs` member is declared, `WGS84` is returned.

EPSG URN designations such as `urn:ogc:def:crs:EPSG::2154` are normalized to their 
short `EPSG:2154` form. Other CRS names are returned as-is.

For complete GeoJSON documents, `validateGeoJson` and `reprojectGeoJson` support a single 
CRS declaration on the root object. Nested CRS declarations are not supported by the validation 
contract.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object |

### Returns

| Type | Description |
|------|-------------|
| `string \| undefined` | The resolved CRS name, `WGS84` if none is declared, or `undefined` if a declared CRS has no name |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

### Examples

```js
// No declared CRS
extractGeoJsonCRS({
  type: 'Point',
  coordinates: [2.349, 48.864]
})
// 'WGS84'
```

```js
// EPSG designation
extractGeoJsonCRS({
  type: 'Point',
  coordinates: [700000, 6600000],
  crs: {
    type: 'name',
    properties: { name: 'EPSG:2154' }
  }
})
// 'EPSG:2154'
```

```js
// EPSG URN
extractGeoJsonCRS({
  type: 'Point',
  coordinates: [700000, 6600000],
  crs: {
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:EPSG::2154' }
  }
})
// 'EPSG:2154'
```

```js
// Other CRS names are preserved
extractGeoJsonCRS({
  type: 'Point',
  coordinates: [2.349, 48.864],
  crs: {
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
  }
})
// 'urn:ogc:def:crs:OGC:1.3:CRS84'
```