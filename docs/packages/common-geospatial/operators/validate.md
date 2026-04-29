---
title: validate
description: Validation of GeoJSON objects, geometries, positions, bounding boxes and CRS.
---

# validate

All validation functions return a result object with the following shape:

```js
{
  valid: boolean,        // whether the object is valid
  errors: { message: string, path?: string, index?: number }[],
  warnings: { message: string, path?: string, index?: number }[]
}
```

Errors indicate structural or semantic invalidity. Warnings are non-blocking observations (e.g. high coordinate precision, antimeridian crossing, missing geometry).

Paths use a JSON Pointer-like notation: `/coordinates/0`, `/features/2/geometry`, `/bbox`.

---

## validatePosition

### Signature

```js
validatePosition(coordinates)
```

### Description

Validates a GeoJSON position. Checks that it is an array of 2 or 3 numbers, that longitude is in `[-180, 180]` and latitude in `[-90, 90]`. Emits a warning if longitude or latitude precision exceeds 6 decimal digits.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coordinates` | `number[]` | yes | A position array `[longitude, latitude]` or `[longitude, latitude, altitude]` |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Examples

```js
validatePosition([2.3522, 48.8566])
// { valid: true, errors: [], warnings: [] }
```

```js
validatePosition([200, 48.8566])
// { valid: false, errors: [{ message: 'Invalid coordinates: longitude must be in the range -180 to 180' }], warnings: [] }
```

```js
validatePosition([2.35221234, 48.8566])
// { valid: true, errors: [], warnings: [{ message: 'longitude precision is high (8 decimals, max recommended: 6)' }] }
```

---

## validateBBox

### Signature

```js
validateBBox(bbox)
```

### Description

Validates a GeoJSON bounding box. Accepts 4-value (2D) and 6-value (3D) arrays. Validates both the south-west and north-east corners as positions. Checks that south ≤ north. Emits a warning if west > east (antimeridian crossing).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `number[]` | yes | A bounding box: `[west, south, east, north]` or `[west, south, minAlt, east, north, maxAlt]` |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Examples

```js
validateBBox([-10, -20, 10, 20])
// { valid: true, errors: [], warnings: [] }
```

```js
validateBBox([-10, 30, 10, 20])
// { valid: false, errors: [{ message: 'Invalid bbox: south (30) must be <= north (20)' }], warnings: [] }
```

```js
validateBBox([170, -20, -170, 20])
// { valid: true, errors: [], warnings: [{ message: 'bbox crosses the antimeridian (west: 170 > east: -170)' }] }
```

---

## validateCRS

### Signature

```js
validateCRS(crs)
```

### Description

Validates a GeoJSON CRS (Coordinate Reference System) object. Supports two types: `name` (requires a non-empty `properties.name` string) and `link` (requires a non-empty `properties.href` string).

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `crs` | `object` | yes | A CRS object |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Examples

```js
validateCRS({ type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } })
// { valid: true, errors: [], warnings: [] }
```

```js
validateCRS({ type: 'link', properties: { href: '' } })
// { valid: false, errors: [{ message: 'Invalid crs: linked crs must have a non-empty properties.href string' }], warnings: [] }
```

```js
validateCRS({ type: 'unknown' })
// { valid: false, errors: [{ message: 'Invalid crs: unknown type: unknown' }], warnings: [] }
```

---

## validateGeometry

### Signature

```js
validateGeometry(geometry, path = '')
```

### Description

Validates a GeoJSON geometry object. Dispatches validation based on `geometry.type`. Validates coordinates recursively for all geometry types. For `Polygon` and `MultiPolygon`, checks that rings are closed, validates winding order (outer ring counter-clockwise, holes clockwise), and detects self-intersections. For `LineString` and `MultiLineString`, warns on antimeridian crossings. If a `bbox` is present, it is validated as well.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geometry` | `object` | yes | A GeoJSON geometry object |
| `path` | `string` | no | Base path for error and warning reporting (default: `''`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Examples

```js
validateGeometry({ type: 'Point', coordinates: [2.3522, 48.8566] })
// { valid: true, errors: [], warnings: [] }
```

```js
validateGeometry({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })
// { valid: true, errors: [], warnings: [] }
```

```js
validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] })
// { valid: false, errors: [{ message: 'Invalid LinearRing: first and last position must be identical', ... }], warnings: [] }
```

```js
validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] })
// { valid: true, errors: [], warnings: [{ message: 'LineString crosses the antimeridian between positions 0 and 1, consider using MultiLineString', ... }] }
```

```js
validateGeometry({ type: 'Unknown', coordinates: [] })
// { valid: false, errors: [{ message: 'Invalid geometry type: Unknown' }], warnings: [] }
```

---

## validateGeoJson

### Signature

```js
validateGeoJson(geoJson)
```

### Description

Validates any GeoJSON object: a geometry, a `Feature`, or a `FeatureCollection`. Dispatches to `validateGeometry` for plain geometries. For `Feature`, validates the geometry if present, and emits a warning if geometry is absent. For `FeatureCollection`, validates each feature recursively. If a `crs` property is present at the root, it is validated as well.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any GeoJSON object |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Throws

Throws if `geoJson` is not a non-empty object.

### Examples

```js
validateGeoJson({ type: 'Point', coordinates: [2.3522, 48.8566] })
// { valid: true, errors: [], warnings: [] }
```

```js
validateGeoJson({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  properties: {}
})
// { valid: true, errors: [], warnings: [] }
```

```js
validateGeoJson({ type: 'Feature', geometry: null, properties: {} })
// { valid: true, errors: [], warnings: [{ message: 'Feature has no geometry' }] }
```

```js
validateGeoJson({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 48.8566] }, properties: {} }
  ]
})
// {
//   valid: false,
//   errors: [{ message: 'Invalid coordinates: longitude must be in the range -180 to 180', path: '/features/0/geometry/coordinates', index: 0 }],
//   warnings: []
// }
```

```js
validateGeoJson({
  type: 'FeatureCollection',
  features: [],
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
})
// { valid: false, errors: [{ message: 'Invalid FeatureCollection: features must be a non empty array' }], warnings: [] }
```