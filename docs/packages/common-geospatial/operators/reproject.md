---
title: reproject
description: Reproject GeoJSON objects between coordinate reference systems.
---

# reproject

This module provides operators to reproject GeoJSON objects between coordinate reference systems.

## reprojectGeoJson

### Signature

```js
reprojectGeoJson (geoJson, target)
```

### Description

Reprojects a GeoJSON object in place to the specified target coordinate reference system.

The source CRS is automatically extracted from the GeoJSON object using `extractGeoJsonCRS`. When no CRS is declared, WGS84 is assumed.

All geometry types, `Feature`, `FeatureCollection`, and nested `GeometryCollection` objects are supported.

Existing `bbox` members are removed because they become invalid after reprojection.

When the target projection is equivalent to WGS84, the `crs` member is removed. Otherwise, the target CRS is stored as a named CRS. EPSG identifiers are written using the OGC URN form, for example `EPSG:3857` becomes `urn:ogc:def:crs:EPSG::3857`.

Altitude values are preserved.

The input object is mutated and returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object |
| `target` | `string` | yes | Name of a registered target projection |

### Returns

| Type | Description |
|------|-------------|
| `object` | The reprojected GeoJSON object. The returned object is the same instance as `geoJson` |

### Throws

Throws if `geoJson` is not a valid GeoJSON object.

Throws if the source CRS is not a registered projection.

Throws if `target` is not a registered projection.

### Examples

```js
// WGS84 to Web Mercator
const point = {
  type: 'Point',
  coordinates: [2.35, 48.85]
}

reprojectGeoJson(point, 'EPSG:3857')

// {
//   type: 'Point',
//   coordinates: [261600.803..., 6249447.752...],
//   crs: {
//     type: 'name',
//     properties: {
//       name: 'urn:ogc:def:crs:EPSG::3857'
//     }
//   }
// }
```

```js
// Source CRS is read from the GeoJSON object
const point = {
  type: 'Point',
  coordinates: [261600.8034, 6249447.7528],
  crs: {
    type: 'name',
    properties: {
      name: 'EPSG:3857'
    }
  }
}

reprojectGeoJson(point, 'EPSG:4326')

// {
//   type: 'Point',
//   coordinates: [2.35, 48.85]
// }
```

```js
// Existing bbox is removed
const feature = {
  type: 'Feature',
  bbox: [2, 48, 3, 49],
  geometry: {
    type: 'Point',
    coordinates: [2.35, 48.85]
  },
  properties: {}
}

reprojectGeoJson(feature, 'EPSG:3857')

// feature.bbox === undefined
```

```js
// Altitude is preserved
const point = {
  type: 'Point',
  coordinates: [2.35, 48.85, 100]
}

reprojectGeoJson(point, 'EPSG:3857')

// [261600.803..., 6249447.752..., 100]
```