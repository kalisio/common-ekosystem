---
title: crs
description: Extract and resolve the coordinate reference system of a GeoJSON object.
---

# crs

## extractCrs

### Signature

```js
extractCrs (geoJson)
```

### Description

Extracts and resolves the coordinate reference system (CRS) declared by a GeoJSON object.

When no `crs` member is declared, `WGS84` is returned.

EPSG URN designations such as `urn:ogc:def:crs:EPSG::2154` are normalized to their short `EPSG:2154` form. Other CRS names are returned as-is.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |

### Returns

| Type | Description |
|------|-------------|
| `string \| undefined` | The resolved CRS name, `WGS84` when no CRS is declared, or `undefined` when a declared CRS has no name |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

### Examples

```js
// No declared CRS — defaults to WGS84
extractCrs({
  type: 'Point',
  coordinates: [2.349, 48.864]
})
// 'WGS84'
```

```js
// EPSG designation
extractCrs({
  type: 'Point',
  coordinates: [2.349, 48.864],
  crs: {
    type: 'name',
    properties: { name: 'EPSG:2154' }
  }
})
// 'EPSG:2154'
```

```js
// EPSG URN — normalized to its short form
extractCrs({
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
extractCrs({
  type: 'Point',
  coordinates: [2.349, 48.864],
  crs: {
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
  }
})
// 'urn:ogc:def:crs:OGC:1.3:CRS84'
```
