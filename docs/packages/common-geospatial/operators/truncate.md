---
title: truncate
description: Truncate coordinate values of GeoJSON objects to a given decimal precision.
---

# truncate

## truncateGeoJson

### Signature

```js
truncateGeoJson (geoJson, precision = 7)
```

### Description

Truncates all coordinate values of a GeoJSON object to the given decimal precision. Accepts any valid GeoJSON type: a plain geometry, a `Feature`, or a `FeatureCollection`. `bbox` properties are truncated at every level — on the root object, on each `Feature`, and on each geometry. The operation is performed **in place** — the original object is mutated and returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any valid GeoJSON object (geometry, Feature, or FeatureCollection) |
| `precision` | `number` | no | Number of decimal digits to keep, between 0 and 8 (default: `7`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | The mutated GeoJSON object |

### Throws

Throws if `geoJson` is not a valid GeoJSON object, or if `precision` is not in range `[0, 8]`.

### Examples

```js
// Plain geometry
truncateGeoJson({ type: 'Point', coordinates: [10.123456789, 20.987654321] })
// { type: 'Point', coordinates: [10.1234568, 20.9876543] }
```

```js
// Feature
truncateGeoJson({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] },
  properties: {}
})
// {
//   type: 'Feature',
//   geometry: { type: 'Point', coordinates: [10.1234568, 20.9876543] },
//   properties: {}
// }
```

```js
// FeatureCollection
truncateGeoJson({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [30.111111111, 40.999999999] }, properties: {} }
  ]
})
// {
//   type: 'FeatureCollection',
//   features: [
//     { type: 'Feature', geometry: { type: 'Point', coordinates: [10.1234568, 20.9876543] }, properties: {} },
//     { type: 'Feature', geometry: { type: 'Point', coordinates: [30.1111111, 41] }, properties: {} }
//   ]
// }
```

```js
// Mutates in place
const geoJson = { type: 'Feature', geometry: { type: 'Point', coordinates: [10.123456789, 20.987654321] }, properties: {} }
const result = truncateGeoJson(geoJson)
result === geoJson // true
```