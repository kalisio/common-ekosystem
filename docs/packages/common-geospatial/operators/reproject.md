---

title: reproject
description: Reproject GeoJSON objects between coordinate reference systems.
---

# reproject

This module provides utilities for reprojecting GeoJSON objects between coordinate reference systems (CRS).

Reprojection is performed in place and supports geometries, features and feature collections.

## reprojectGeoJson

### Signature

```js
reprojectGeoJson(geoJson, source, target)
```

### Description

Reprojects all coordinates of a GeoJSON object from a source coordinate reference system to a target coordinate reference system.

The operation is performed recursively and supports:

* GeoJSON geometries;
* `GeometryCollection`;
* `Feature`;
* `FeatureCollection`.

Existing bounding boxes (`bbox`) are removed because they are no longer valid after reprojection.


::: warning
`reprojectGeoJson` mutates the input GeoJSON object in place and returns the same reference.
Any existing bbox is removed because its coordinates belong to the original coordinate reference system.
:::

### Parameters

| Name      | Type     | Required | Description                 |
| --------- | -------- | -------- | --------------------------- |
| `geoJson` | `Object` | yes      | GeoJSON object to reproject |
| `source`  | `string` | yes      | Source projection name      |
| `target`  | `string` | yes      | Target projection name      |

The source and target projections must be registered using `defineProjection()`.

### Returns

| Type     | Description                    |
| -------- | ------------------------------ |
| `Object` | The reprojected GeoJSON object |

### Throws

Throws if:

* `geoJson` is not a supported GeoJSON object;
* `source` is not a registered projection;
* `target` is not a registered projection;
* a coordinate is invalid.

### Examples

```js
const feature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.3522, 48.8566]
  },
  properties: {
    name: 'Paris'
  }
}

reprojectGeoJson(feature, 'EPSG:4326', 'EPSG:3857')

// feature.geometry.coordinates
// [261845.7..., 6250564.3...]
```

The operation mutates and returns the input object:

```js
const result = reprojectGeoJson(
  feature,
  'EPSG:4326',
  'EPSG:3857'
)

result === feature // true
```

Bounding boxes are removed during reprojection:

```js
const feature = {
  type: 'Feature',
  bbox: [2, 48, 3, 49],
  geometry: {
    type: 'Point',
    coordinates: [2.3522, 48.8566]
  },
  properties: {}
}

reprojectGeoJson(feature, 'EPSG:4326', 'EPSG:3857')

feature.bbox // undefined
```

