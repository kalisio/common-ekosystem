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

## Errors and warnings reference

### Errors

| Emitted by | Message pattern | Cause |
|---|---|---|
| `validatePosition` | `Invalid coordinates: longitude must be in the range -180 to 180` | Longitude out of range |
| `validatePosition` | `Invalid coordinates: latitude must be in the range -90 to 90` | Latitude out of range |
| `validatePosition` | `Invalid coordinates: altitude must be a number` | Altitude is not a finite number |
| `validateBBox` | `Invalid bbox: must be an array of 4 or 6 numbers` | Wrong length or wrong type |
| `validateBBox` | `Invalid bbox: south-west corner — …` | SW corner fails position validation |
| `validateBBox` | `Invalid bbox: north-east corner — …` | NE corner fails position validation |
| `validateBBox` | `Invalid bbox: south (N) must be <= north (M)` | South latitude exceeds north |
| `validateCRS` | `Invalid crs: unknown type: …` | `type` is neither `name` nor `link` |
| `validateCRS` | `Invalid crs: named crs must have a non-empty properties.name string` | Missing or empty `properties.name` |
| `validateCRS` | `Invalid crs: linked crs must have a non-empty properties.href string` | Missing or empty `properties.href` |
| `validateGeometry` | `Invalid geometry type: …` | Unknown `type` value |
| `validateGeometry` | `Invalid LinearRing: first and last position must be identical` | Ring is not closed |
| `validateGeometry` | `Invalid LinearRing: must have at least 4 positions` | Ring has fewer than 4 positions |
| `validateGeometry` | `Invalid LinearRing: self-intersection detected` | Ring crosses itself |
| `validateGeoJson` | `Invalid GeoJson: type must be either a Geometry, a Feature or a FeatureCollection` | Unknown root type |
| `validateGeoJson` | `Invalid FeatureCollection: features must be a non empty array` | `features` is empty or not an array |

### Warnings

| Emitted by | Message pattern | Cause |
|---|---|---|
| `validatePosition` | `longitude precision is high (N decimals, max recommended: 6)` | Longitude has more than 6 decimal digits |
| `validatePosition` | `latitude precision is high (N decimals, max recommended: 6)` | Latitude has more than 6 decimal digits |
| `validateBBox` | `bbox crosses the antimeridian (west: N > east: M)` | West > east in a bounding box |
| `validateGeometry` | `LineString crosses the antimeridian between positions N and M, consider using MultiLineString` | Segment jumps across the antimeridian |
| `validateGeometry` | `Polygon outer ring should be counter-clockwise` | Outer ring has clockwise winding |
| `validateGeometry` | `Polygon hole ring should be clockwise` | A hole ring has counter-clockwise winding |
| `validateGeoJson` | `Feature has no geometry` | `geometry` is `null` or absent |

---

## Behavioral notes

### Winding order

The GeoJSON specification ([RFC 7946 §3.1.6](https://www.rfc-editor.org/rfc/rfc7946#section-3.1.6)) mandates that polygon rings follow a specific winding order: the outer ring must be **counter-clockwise** and holes must be **clockwise** (both when viewed on a standard map with north up). Violations emit a **warning**, not an error, to stay compatible with data produced by tools that do not enforce winding order.

```js
// Outer ring is clockwise → warning
validateGeometry({
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
})
// { valid: true, errors: [], warnings: [{ message: 'Polygon outer ring should be counter-clockwise' }] }

// Outer ring CCW, hole CCW → warning on the hole
validateGeometry({
  type: 'Polygon',
  coordinates: [
    [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],  // outer CCW ✓
    [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]]        // hole should be CW ✗
  ]
})
// { valid: true, errors: [], warnings: [{ message: 'Polygon hole ring should be clockwise' }] }
```

### Antimeridian crossings

A segment is considered to cross the antimeridian when the absolute difference between the longitudes of two consecutive positions exceeds 180°. When this happens, `validateGeometry` emits a warning and suggests splitting the geometry into a `MultiLineString` or `MultiPolygon`. `validateBBox` emits a warning when `west > east`.

```js
validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] })
// { valid: true, errors: [], warnings: [{ message: 'LineString crosses the antimeridian between positions 0 and 1, consider using MultiLineString' }] }

validateBBox([170, -20, -170, 20])
// { valid: true, errors: [], warnings: [{ message: 'bbox crosses the antimeridian (west: 170 > east: -170)' }] }
```

### Self-intersections

Self-intersections are checked on `Polygon` and `MultiPolygon` rings. A ring self-intersects when any two non-adjacent edges cross. This produces an **error**.

```js
validateGeometry({
  type: 'Polygon',
  coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]] // bowtie shape
})
// { valid: false, errors: [{ message: 'Invalid LinearRing: self-intersection detected' }], warnings: [] }
```

### Coordinate precision

More than 6 decimal digits on longitude or latitude (~0.1 mm resolution) produces a warning. The value is still considered valid.

```js
validatePosition([2.35221234, 48.8566])
// { valid: true, errors: [], warnings: [{ message: 'longitude precision is high (8 decimals, max recommended: 6)' }] }
```

### CRS support

The `crs` property was removed from the GeoJSON specification in RFC 7946 but remains present in older data and in some GIS exports. `validateGeoJson` validates the `crs` object if present at the root of a `Feature` or `FeatureCollection`. Two types are supported: `name` and `link`.

```js
validateGeoJson({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
})
// { valid: true, errors: [], warnings: [] }
```

---

## validatePosition

### Signature

```js
validatePosition (coordinates)
```

### Description

Validates a GeoJSON position. Checks that it is an array of 2 or 3 finite numbers, that longitude is in `[-180, 180]` and latitude in `[-90, 90]`. Emits a warning if longitude or latitude precision exceeds 6 decimal digits.

Non-finite values (`NaN`, `Infinity`, `-Infinity`) and non-number elements (`null`, strings) are rejected.

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

validatePosition([2.3522, 48.8566, 35])
// { valid: true, errors: [], warnings: [] }

validatePosition([200, 48.8566])
// { valid: false, errors: [{ message: 'Invalid coordinates: longitude must be in the range -180 to 180' }], warnings: [] }

validatePosition([0, -91])
// { valid: false, errors: [{ message: 'Invalid coordinates: latitude must be in the range -90 to 90' }], warnings: [] }

validatePosition([NaN, 48])
// { valid: false, errors: [{ message: 'Invalid coordinates: longitude must be in the range -180 to 180' }], warnings: [] }

validatePosition([2.35221234, 48.8566])
// { valid: true, errors: [], warnings: [{ message: 'longitude precision is high (8 decimals, max recommended: 6)' }] }
```

---

## validateBBox

### Signature

```js
validateBBox (bbox)
```

### Description

Validates a GeoJSON bounding box. Accepts 4-value (2D) and 6-value (3D) arrays. Validates both the south-west and north-east corners as positions. Checks that south ≤ north. Emits a warning if west > east (antimeridian crossing). Precision warnings from corner positions are forwarded.

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

validateBBox([-10, -10, 0, 10, 10, 100])
// valid 3D bbox: { valid: true, errors: [], warnings: [] }

validateBBox([-10, 30, 10, 20])
// { valid: false, errors: [{ message: 'Invalid bbox: south (30) must be <= north (20)' }], warnings: [] }

validateBBox([170, -20, -170, 20])
// { valid: true, errors: [], warnings: [{ message: 'bbox crosses the antimeridian (west: 170 > east: -170)' }] }
```

---

## validateCRS

### Signature

```js
validateCRS (crs)
```

### Description

Validates a GeoJSON CRS (Coordinate Reference System) object. Supports two types: `name` (requires a non-empty `properties.name` string) and `link` (requires a non-empty `properties.href` string). The optional `type` field on a `link` CRS is not validated.

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

validateCRS({ type: 'link', properties: { href: 'https://example.com/crs', type: 'proj4' } })
// { valid: true, errors: [], warnings: [] }

validateCRS({ type: 'link', properties: { href: '' } })
// { valid: false, errors: [{ message: 'Invalid crs: linked crs must have a non-empty properties.href string' }], warnings: [] }

validateCRS({ type: 'unknown' })
// { valid: false, errors: [{ message: 'Invalid crs: unknown type: unknown' }], warnings: [] }
```

---

## validateGeometry

### Signature

```js
validateGeometry (geometry, path = '')
```

### Description

Validates a GeoJSON geometry object. Dispatches validation based on `geometry.type`. Validates coordinates recursively for all geometry types. For `Polygon` and `MultiPolygon`, checks that rings are closed (first and last position identical), have at least 4 positions, follow the correct winding order, and contain no self-intersections. For `LineString` and `MultiLineString`, warns on antimeridian crossings. If a `bbox` is present, it is validated as well.

The `path` parameter is used internally when called from `validateGeoJson` to produce accurate error paths (e.g. `/features/2/geometry`). You do not need to pass it directly.

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

validateGeometry({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })
// { valid: true, errors: [], warnings: [] }

// Unclosed ring
validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] })
// { valid: false, errors: [{ message: 'Invalid LinearRing: first and last position must be identical', path: '/coordinates/0' }], warnings: [] }

// Antimeridian crossing
validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] })
// { valid: true, errors: [], warnings: [{ message: 'LineString crosses the antimeridian between positions 0 and 1, consider using MultiLineString', path: '/coordinates' }] }

// Self-intersecting polygon (bowtie)
validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]] })
// { valid: false, errors: [{ message: 'Invalid LinearRing: self-intersection detected', path: '/coordinates/0' }], warnings: [] }

validateGeometry({ type: 'Unknown', coordinates: [] })
// { valid: false, errors: [{ message: 'Invalid geometry type: Unknown' }], warnings: [] }
```

---

## validateGeoJson

### Signature

```js
validateGeoJson (geoJson)
```

### Description

Validates any GeoJSON object: a geometry, a `Feature`, or a `FeatureCollection`. Dispatches to `validateGeometry` for plain geometries. For `Feature`, validates the geometry if present, and emits a warning if geometry is `null` or absent. For `FeatureCollection`, validates each feature recursively and reports the index of any invalid feature. If a `crs` property is present at the root, it is validated as well.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | Any GeoJSON object |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Throws

Throws a `TypeError` if `geoJson` is not a non-empty plain object.

### Examples

```js
validateGeoJson({ type: 'Point', coordinates: [2.3522, 48.8566] })
// { valid: true, errors: [], warnings: [] }

validateGeoJson({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  properties: {}
})
// { valid: true, errors: [], warnings: [] }

// Feature with no geometry
validateGeoJson({ type: 'Feature', geometry: null, properties: {} })
// { valid: true, errors: [], warnings: [{ message: 'Feature has no geometry' }] }

// Invalid coordinate inside a FeatureCollection — error includes path and index
validateGeoJson({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 48.8566] }, properties: {} }
  ]
})
// {
//   valid: false,
//   errors: [{
//     message: 'Invalid coordinates: longitude must be in the range -180 to 180',
//     path: '/features/1/geometry/coordinates',
//     index: 1
//   }],
//   warnings: []
// }

// Empty features array
validateGeoJson({ type: 'FeatureCollection', features: [] })
// { valid: false, errors: [{ message: 'Invalid FeatureCollection: features must be a non empty array' }], warnings: [] }

// CRS validated when present
validateGeoJson({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
  crs: { type: 'link', properties: { href: '' } }
})
// { valid: false, errors: [{ message: 'Invalid crs: linked crs must have a non-empty properties.href string' }], warnings: [] }
```