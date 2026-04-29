---
title: truncate
description: Truncate coordinate values of GeoJSON objects to a given decimal precision.
---

# truncate

## truncatePosition

### Signature

```js
truncatePosition (position, precision = 7)
```

### Description

Truncates each coordinate value of a GeoJSON position to the given decimal precision. Supports both 2D (`[longitude, latitude]`) and 3D (`[longitude, latitude, altitude]`) positions. The operation is performed **in place** — the original array is mutated and returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `number[]` | yes | A GeoJSON position (2 or 3 values) |
| `precision` | `number` | no | Number of decimal digits to keep, between 0 and 8 (default: `7`) |

### Returns

| Type | Description |
|------|-------------|
| `number[]` | The mutated position |

### Throws

Throws if `position` is not a valid position, or if `precision` is not in range `[0, 8]`.

### Examples

```js
// Default precision (7)
truncatePosition([10.123456789, 20.987654321])
// [10.1234568, 20.9876543]
```

```js
// Custom precision
truncatePosition([10.123456789, 20.987654321], 3)
// [10.123, 20.988]
```

```js
// 3D position (with altitude)
truncatePosition([10.123456789, 20.987654321, 100.123456789], 5)
// [10.12346, 20.98765, 100.12346]
```

```js
// Mutates in place
const position = [10.123456789, 20.987654321]
const result = truncatePosition(position)
result === position // true
```

## truncateBBox

### Signature

```js
truncateBBox (bbox, precision = 7)
```

### Description

Truncates each coordinate value of a GeoJSON bounding box to the given decimal precision. Supports both 2D (`[minX, minY, maxX, maxY]`) and 3D (`[minX, minY, minZ, maxX, maxY, maxZ]`) bounding boxes. The operation is performed **in place** — the original array is mutated and returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `number[]` | yes | A GeoJSON bounding box (4 or 6 values) |
| `precision` | `number` | no | Number of decimal digits to keep, between 0 and 8 (default: `7`) |

### Returns

| Type | Description |
|------|-------------|
| `number[]` | The mutated bounding box |

### Throws

Throws if `bbox` is not a valid bounding box, or if `precision` is not in range `[0, 8]`.

### Examples

```js
// Default precision (7)
truncateBBox([-10.123456789, -20.987654321, 10.123456789, 20.987654321])
// [-10.1234568, -20.9876543, 10.1234568, 20.9876543]
```

```js
// Custom precision
truncateBBox([-10.123456789, -20.987654321, 10.123456789, 20.987654321], 3)
// [-10.123, -20.988, 10.123, 20.988]
```

```js
// 3D bounding box
truncateBBox([-10.123456789, -20.987654321, 0.123456789, 10.123456789, 20.987654321, 1.987654321], 5)
// [-10.12346, -20.98765, 0.12346, 10.12346, 20.98765, 1.98765]
```

```js
// Mutates in place
const bbox = [-10.123456789, -20.987654321, 10.123456789, 20.987654321]
const result = truncateBBox(bbox)
result === bbox // true
```

## truncateGeometry

### Signature

```js
truncateGeometry (geometry, precision = 7)
```

### Description

Truncates all coordinate values of a GeoJSON geometry to the given decimal precision. Supports all GeoJSON geometry types, including `GeometryCollection`. If the geometry has a `bbox` property, it is truncated as well. The operation is performed **in place** — the original object is mutated and returned.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geometry` | `object` | yes | A GeoJSON geometry object |
| `precision` | `number` | no | Number of decimal digits to keep, between 0 and 8 (default: `7`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | The mutated geometry |

### Throws

Throws if `geometry` is not a valid GeoJSON geometry, or if `precision` is not in range `[0, 8]`.

### Examples

```js
// Point
truncateGeometry({ type: 'Point', coordinates: [10.123456789, 20.987654321] })
// { type: 'Point', coordinates: [10.1234568, 20.9876543] }
```

```js
// LineString
truncateGeometry({
  type: 'LineString',
  coordinates: [[10.123456789, 20.987654321], [30.111111111, 40.999999999]]
})
// { type: 'LineString', coordinates: [[10.1234568, 20.9876543], [30.1111111, 41]] }
```

```js
// With bbox
truncateGeometry({
  type: 'Point',
  coordinates: [10.123456789, 20.987654321],
  bbox: [10.123456789, 20.987654321, 10.123456789, 20.987654321]
})
// {
//   type: 'Point',
//   coordinates: [10.1234568, 20.9876543],
//   bbox: [10.1234568, 20.9876543, 10.1234568, 20.9876543]
// }
```

```js
// Mutates in place
const geometry = { type: 'Point', coordinates: [10.123456789, 20.987654321] }
const result = truncateGeometry(geometry)
result === geometry // true
```

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