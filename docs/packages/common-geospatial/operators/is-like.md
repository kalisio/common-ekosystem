---
title: is-like
description: Type guard validators for GeoJSON objects and related structures.
---

# is-like

## Constants

### GEOMETRY_TYPES

All GeoJSON geometry type strings as an enum-like object.

```js
GEOMETRY_TYPES = {
  POINT: 'Point',
  MULTI_POINT: 'MultiPoint',
  LINESTRING: 'LineString',
  MULTI_LINESTRING: 'MultiLineString',
  POLYGON: 'Polygon',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection'
}
```

### FEATURE_TYPES

GeoJSON feature type strings.

```js
FEATURE_TYPES = {
  FEATURE: 'Feature',
  FEATURE_COLLECTION: 'FeatureCollection'
}
```

### CRS_TYPES

GeoJSON CRS (Coordinate Reference System) type strings.

```js
CRS_TYPES = {
  NAME: 'name',
  LINK: 'link'
}
```

## isLikeCRS

### Signature

```js
isLikeCRS (object)
```

### Description

Returns `true` if `object` is a valid GeoJSON CRS (Coordinate Reference System) object. Supports two types: `name` (requires a non-empty `properties.name` string) and `link` (requires a non-empty `properties.href` string).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `object` | `any` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid CRS object |

### Examples

```js
isLikeCRS({ type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } })
// true

isLikeCRS({ type: 'link', properties: { href: 'https://example.com/crs', type: 'proj4' } })
// true

isLikeCRS({ type: 'name', properties: {} })
// false — missing name

isLikeCRS({ type: 'link', properties: { href: '' } })
// false — empty href

isLikeCRS({ type: 'unknown' })
// false

isLikeCRS(null)
// false
```

## isLikePosition

### Signature

```js
isLikePosition (object)
```

### Description

Returns `true` if `object` is a valid GeoJSON position: an array of 2 or 3 numbers.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `object` | `any` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid position |

### Examples

```js
isLikePosition([10, 20])         // true — 2D position
isLikePosition([10, 20, 100])    // true — 3D position (with altitude)
isLikePosition([10])             // false — too short
isLikePosition([10, 20, 30, 40]) // false — too long
isLikePosition([10, 'twenty'])   // false — non-numeric value
isLikePosition(null)             // false
```

## isLikeBBox

### Signature

```js
isLikeBBox (object)
```

### Description

Returns `true` if `object` is a valid GeoJSON bounding box: an array of 4 or 6 numbers.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `object` | `any` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid bounding box |

### Examples

```js
isLikeBBox([1, 2, 3, 4])           // true
isLikeBBox([1, 2, 3, 4, 5, 6])     // true — 3D bbox
isLikeBBox([1, 2, 3])              // false — wrong length
isLikeBBox([1, 2, 3, 'four'])      // false — non-numeric value
isLikeBBox(null)                   // false
```

## isLikeGeometry

### Signature

```js
isLikeGeometry (object)
```

### Description

Returns `true` if `object` is a valid GeoJSON geometry. Checks that the object has a recognized `type` from `GEOMETRY_TYPES`, and that it has a `coordinates` array (or a `geometries` array for `GeometryCollection`). Does not deeply validate coordinate values.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `object` | `any` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid GeoJSON geometry |

### Examples

```js
isLikeGeometry({ type: 'Point', coordinates: [10, 20] })
// true

isLikeGeometry({ type: 'GeometryCollection', geometries: [] })
// true

isLikeGeometry({ type: 'Point' })
// false — missing coordinates

isLikeGeometry({ type: 'Unknown', coordinates: [10, 20] })
// false — unrecognized type

isLikeGeometry(null)
// false
```

## isLikeFeature

### Signature

```js
isLikeFeature (object)
```

### Description

Returns `true` if `object` is a GeoJSON `Feature`, i.e. a plain object with `type === 'Feature'`. Does not validate the `geometry` or `properties` fields.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `object` | `any` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a GeoJSON Feature |

### Examples

```js
isLikeFeature({ type: 'Feature', geometry: null, properties: {} })
// true

isLikeFeature({ type: 'FeatureCollection', features: [] })
// false

isLikeFeature(null)
// false
```

## isLikeFeatureCollection

### Signature

```js
isLikeFeatureCollection (object)
```

### Description

Returns `true` if `object` is a GeoJSON `FeatureCollection`, i.e. a plain object with `type === 'FeatureCollection'` and a `features` array. Does not validate the contents of `features`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `object` | `any` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a GeoJSON FeatureCollection |

### Examples

```js
isLikeFeatureCollection({ type: 'FeatureCollection', features: [] })
// true

isLikeFeatureCollection({ type: 'FeatureCollection' })
// false — missing features array

isLikeFeatureCollection({ type: 'Feature', geometry: null, properties: {} })
// false

isLikeFeatureCollection(null)
// false
```

## isLikeFeatureOrFeatureCollection

### Signature

```js
isLikeFeatureOrFeatureCollection (value)
```

### Description

Returns whether a value structurally resembles a GeoJSON `Feature` or `FeatureCollection`.

This is a lightweight structural check and does not perform full GeoJSON validation.

### Parameters

| Name    | Type  | Required | Description   |
| ------- | ----- | -------- | ------------- |
| `value` | `any` | yes      | Value to test |

### Returns

| Type      | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `boolean` | `true` if the value resembles a Feature or FeatureCollection |

## isLikeGeoJson

### Signature

```js
isLikeGeoJson (object)
```

### Description

Returns `true` if `object` is any valid GeoJSON object: a geometry, a `Feature`, or a `FeatureCollection`. Delegates to `isLikeGeometry`, `isLikeFeature`, and `isLikeFeatureCollection`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `object` | `any` | yes | Value to check |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if the value is a valid GeoJSON object |

### Examples

```js
isLikeGeoJson({ type: 'Point', coordinates: [10, 20] })
// true — geometry

isLikeGeoJson({ type: 'Feature', geometry: null, properties: {} })
// true — Feature

isLikeGeoJson({ type: 'FeatureCollection', features: [] })
// true — FeatureCollection

isLikeGeoJson({ type: 'Unknown' })
// false

isLikeGeoJson(null)
// false
```
