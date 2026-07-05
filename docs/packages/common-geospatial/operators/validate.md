---
title: validate
description: Validation of GeoJSON objects, geometries, positions, bounding boxes and CRS.
---

# validate

All validation functions return a result object with the following shape:

```js
{
  valid: boolean,        // whether the object is valid
  errors: { code: string, path?: string, index?: number, params?: object }[],
  warnings: { code: string, path?: string, index?: number, params?: object }[]
}
```

Errors indicate structural or semantic invalidity. Warnings are non-blocking observations (e.g. high coordinate precision, antimeridian crossing, missing geometry).

Every error and warning carries a stable `code` from `VALIDATION_CODES` (see `validate/codes.js`) instead of a human-readable message. This lets consuming applications translate and react to specific issues programmatically without depending on message wording. Optional `params` carry the dynamic values a translation may need (e.g. the out-of-range value, the expected vs actual winding order).

Paths use a JSON Pointer-like notation: `/coordinates/0`, `/features/2/geometry`, `/bbox`.

---

## Errors and warnings reference

### Errors

| Emitted by | Code | `params` | Cause |
|---|---|---|---|
| `validatePosition` | `INVALID_POSITION_LENGTH` | — | Not an array of 2 or 3 numbers |
| `validatePosition` | `INVALID_POSITION_COORDINATES` | — | An element is not a finite number (`NaN`, `Infinity`, `null`, string...) |
| `validatePosition` | `INVALID_LONGITUDE_RANGE` | `{ value }` | Longitude out of range `[-180, 180]` |
| `validatePosition` | `INVALID_LATITUDE_RANGE` | `{ value }` | Latitude out of range `[-90, 90]` |
| `validatePosition` | `INVALID_ALTITUDE` | — | Altitude is not a finite number |
| `validateBBox` | `INVALID_BBOX_LENGTH` | — | Wrong length or wrong type |
| `validateBBox` | `INVALID_BBOX_LATITUDE_ORDER` | `{ south, north }` | South latitude exceeds north |
| `validateBBox` | `INVALID_BBOX_ALTITUDE_ORDER` | `{ minAlt, maxAlt }` | Min altitude exceeds max altitude (3D bbox) |
| `validateCRS` | `INVALID_CRS_OBJECT` | — | `crs` is not a plain object |
| `validateCRS` | `INVALID_CRS_TYPE` | `{ type }` | `type` is neither `name` nor `link` (or missing) |
| `validateCRS` | `INVALID_CRS_NAME` | — | Missing or empty `properties.name` on a `name` CRS |
| `validateCRS` | `INVALID_CRS_LINK` | — | Missing or empty `properties.href` on a `link` CRS |
| `validateGeometry` | `INVALID_GEOMETRY` | — | Not a non-empty object |
| `validateGeometry` | `INVALID_GEOMETRY_TYPE` | `{ type }` | Unknown `type` value |
| `validateGeometry` | `INVALID_COORDINATES_LENGTH` | `{ minimumLength }` | Coordinates array shorter than required |
| `validateGeometry` | `INVALID_MULTI_LINESTRING_COORDINATES` | — | `MultiLineString.coordinates` is empty or not an array |
| `validateGeometry` | `INVALID_POLYGON_COORDINATES` | — | `Polygon.coordinates` is empty or not an array |
| `validateGeometry` | `INVALID_MULTIPOLYGON_COORDINATES` | — | `MultiPolygon.coordinates` is empty or not an array |
| `validateGeometry` | `INVALID_GEOMETRYCOLLECTION_GEOMETRIES` | — | `GeometryCollection.geometries` is empty or not an array |
| `validateGeometry` | `RING_NOT_CLOSED` | — | First and last position of a ring differ |
| `validateGeometry` | `SELF_INTERSECTION` | `{ count }` | Ring crosses itself |
| `validateGeoJson` | `UNKNOWN_TYPE` | `{ type }` | Root or feature `type` is not a Geometry, `Feature`, or `FeatureCollection` |
| `validateGeoJson` | `INVALID_FEATURES_ARRAY` | — | `features` is empty or not an array |
| `validateGeoJson` | `EMPTY_OBJECT` | — | Feature is not a non-empty object |

### Warnings

| Emitted by | Code | `params` | Cause |
|---|---|---|---|
| `validatePosition` | `HIGH_LONGITUDE_PRECISION` | `{ precision, max }` | Longitude has more than 6 decimal digits |
| `validatePosition` | `HIGH_LATITUDE_PRECISION` | `{ precision, max }` | Latitude has more than 6 decimal digits |
| `validateBBox` | `BBOX_ANTIMERIDIAN_CROSSING` | `{ west, east }` | West > east in a bounding box |
| `validateGeometry` | `ANTIMERIDIAN_CROSSING` | — | Segment jumps across the antimeridian |
| `validateGeometry` | `INVALID_WINDING_ORDER` | `{ expected, actual }` | A ring's winding order doesn't match what's expected for its role (outer/hole) |
| `validateGeometry` | `DUPLICATE_POSITION` | — | Two consecutive positions are the same (within precision) |
| `validateGeoJson` | `MISSING_GEOMETRY` | — | `geometry` is `null` or absent on a `Feature` |

---

## Behavioral notes

### Duplicate positions

Two consecutive positions are considered duplicates when they are equal within a fixed precision (10 decimal digits), checked via `isSamePosition`. This applies to `LineString`, `MultiLineString` (per line), `Polygon`, and `MultiPolygon` (per ring) — not `MultiPoint`, where positions have no adjacency relationship. This is a **warning**: valid per the GeoJSON spec, but a common source of failures for consumers with stricter topology requirements (e.g. MongoDB's `2dsphere` index, which can reject a duplicate consecutive vertex outright).

```js
validateGeometry({
  type: 'LineString',
  coordinates: [[0, 0], [1, 1], [1, 1], [2, 2]]
})
// { valid: true, errors: [], warnings: [{ code: 'DUPLICATE_POSITION', path: '/coordinates/1' }] }
```

**Interaction with self-intersection**: on a `Polygon` or `MultiPolygon` ring, a duplicate consecutive position creates a zero-length edge, which the self-intersection check treats as a degenerate crossing. A ring with a duplicate will therefore also fail with a `SELF_INTERSECTION` **error**, not just the `DUPLICATE_POSITION` warning — even though the ring is otherwise perfectly well-formed.

```js
validateGeometry({
  type: 'Polygon',
  coordinates: [[[0, 0], [10, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
})
// {
//   valid: false,
//   errors: [{ code: 'SELF_INTERSECTION', path: '/coordinates/0', params: { count: 1 } }],
//   warnings: [{ code: 'DUPLICATE_POSITION', path: '/coordinates/0/1' }]
// }
```

### Winding order

The GeoJSON specification ([RFC 7946 §3.1.6](https://www.rfc-editor.org/rfc/rfc7946#section-3.1.6)) mandates that polygon rings follow a specific winding order: the outer ring must be **counter-clockwise** and holes must be **clockwise** (both when viewed on a standard map with north up). Violations emit a **warning**, not an error, to stay compatible with data produced by tools that do not enforce winding order.

```js
// Outer ring is clockwise → warning
validateGeometry({
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
})
// { valid: true, errors: [], warnings: [{ code: 'INVALID_WINDING_ORDER', params: { expected: 'counter-clockwise', actual: 'clockwise' } }] }

// Outer ring CCW, hole also CCW → warning on the hole
validateGeometry({
  type: 'Polygon',
  coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],   // outer CCW ✓
    [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]]         // hole is CCW, should be CW ✗
  ]
})
// { valid: true, errors: [], warnings: [{ code: 'INVALID_WINDING_ORDER', params: { expected: 'clockwise', actual: 'counter-clockwise' } }] }

### Antimeridian crossings

A segment is considered to cross the antimeridian when the absolute difference between the longitudes of two consecutive positions exceeds 180°. When this happens, `validateGeometry` emits a warning. `validateBBox` emits a warning when `west > east`.

```js
validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] })
// { valid: true, errors: [], warnings: [{ code: 'ANTIMERIDIAN_CROSSING', path: '/coordinates/0' }] }

validateBBox([170, -20, -170, 20])
// { valid: true, errors: [], warnings: [{ code: 'BBOX_ANTIMERIDIAN_CROSSING', params: { west: 170, east: -170 } }] }
```

### Self-intersections

Self-intersections are checked on `Polygon` and `MultiPolygon` rings. A ring self-intersects when any two non-adjacent edges cross. This produces an **error**.

```js
validateGeometry({
  type: 'Polygon',
  coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]] // bowtie shape
})
// { valid: false, errors: [{ code: 'SELF_INTERSECTION', params: { count: 1 } }], warnings: [] }
```

### Coordinate precision

More than 6 decimal digits on longitude or latitude (~0.1 mm resolution) produces a warning. The value is still considered valid.

```js
validatePosition([2.35221234, 48.8566])
// { valid: true, errors: [], warnings: [{ code: 'HIGH_LONGITUDE_PRECISION', params: { precision: 8, max: 6 } }] }
```

### CRS support

The `crs` property was removed from the GeoJSON specification in RFC 7946 but remains present in older data and in some GIS exports. `validateGeoJson` validates the `crs` object if present at the root, and on each `Feature` within a `FeatureCollection`. Two types are supported: `name` and `link`.

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
validatePosition (coordinates, path = '')
```

### Description

Validates a GeoJSON position. Checks that it is an array of 2 or 3 finite numbers, that longitude is in `[-180, 180]` and latitude in `[-90, 90]`. Emits a warning if longitude or latitude precision exceeds 6 decimal digits.

Non-finite values (`NaN`, `Infinity`, `-Infinity`) and non-number elements (`null`, strings) are rejected with `INVALID_POSITION_COORDINATES`.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coordinates` | `number[]` | yes | A position array `[longitude, latitude]` or `[longitude, latitude, altitude]` |
| `path` | `string` | no | Base path for error and warning reporting (default: `''`) |

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
// { valid: false, errors: [{ code: 'INVALID_LONGITUDE_RANGE', params: { value: 200 } }], warnings: [] }

validatePosition([0, -91])
// { valid: false, errors: [{ code: 'INVALID_LATITUDE_RANGE', params: { value: -91 } }], warnings: [] }

validatePosition([NaN, 48])
// { valid: false, errors: [{ code: 'INVALID_POSITION_COORDINATES' }], warnings: [] }

validatePosition([2.35221234, 48.8566])
// { valid: true, errors: [], warnings: [{ code: 'HIGH_LONGITUDE_PRECISION', params: { precision: 8, max: 6 } }] }
```

---

## validateBBox

### Signature

```js
validateBBox (bbox, path = '')
```

### Description

Validates a GeoJSON bounding box. Accepts 4-value (2D) and 6-value (3D) arrays. Validates both the south-west and north-east corners as positions (reported under `${path}/min` and `${path}/max`). Checks that south ≤ north (and min altitude ≤ max altitude for 3D). Emits a warning if west > east (antimeridian crossing). Precision warnings from corner positions are forwarded.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `number[]` | yes | A bounding box: `[west, south, east, north]` or `[west, south, minAlt, east, north, maxAlt]` |
| `path` | `string` | no | Base path for error and warning reporting (default: `''`) |

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
// { valid: false, errors: [{ code: 'INVALID_BBOX_LATITUDE_ORDER', params: { south: 30, north: 20 } }], warnings: [] }

validateBBox([170, -20, -170, 20])
// { valid: true, errors: [], warnings: [{ code: 'BBOX_ANTIMERIDIAN_CROSSING', params: { west: 170, east: -170 } }] }
```

---

## validateCRS

### Signature

```js
validateCRS (crs, path = '')
```

### Description

Validates a GeoJSON CRS (Coordinate Reference System) object. Supports two types: `name` (requires a non-empty `properties.name` string) and `link` (requires a non-empty `properties.href` string). The optional `type` field on a `link` CRS is not validated.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `crs` | `object` | yes | A CRS object |
| `path` | `string` | no | Base path for error and warning reporting (default: `''`) |

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
// { valid: false, errors: [{ code: 'INVALID_CRS_LINK' }], warnings: [] }

validateCRS({ type: 'unknown' })
// { valid: false, errors: [{ code: 'INVALID_CRS_TYPE', params: { type: 'unknown' } }], warnings: [] }
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
// { valid: false, errors: [{ code: 'RING_NOT_CLOSED', path: '/coordinates/0' }], warnings: [] }

// Antimeridian crossing
validateGeometry({ type: 'LineString', coordinates: [[170, 0], [-170, 0]] })
// { valid: true, errors: [], warnings: [{ code: 'ANTIMERIDIAN_CROSSING', path: '/coordinates/0' }] }

// Self-intersecting polygon (bowtie)
validateGeometry({ type: 'Polygon', coordinates: [[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]] })
// { valid: false, errors: [{ code: 'SELF_INTERSECTION', path: '/coordinates/0', params: { count: 1 } }], warnings: [] }

validateGeometry({ type: 'Unknown', coordinates: [] })
// { valid: false, errors: [{ code: 'INVALID_GEOMETRY_TYPE', params: { type: 'Unknown' } }], warnings: [] }
```

---

## validateGeoJson

### Signature

```js
validateGeoJson (geoJson)
```

### Description

Validates any GeoJSON object: a geometry, a `Feature`, or a `FeatureCollection`. Dispatches to `validateGeometry` for plain geometries. For `Feature`, validates the geometry if present, and emits a warning if geometry is `null` or absent. For `FeatureCollection`, validates each feature recursively and reports the index of any invalid feature. If a `crs` property is present, it is validated wherever it appears (root, `Feature`, or `FeatureCollection`).

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
// { valid: true, errors: [], warnings: [{ code: 'MISSING_GEOMETRY' }] }

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
//     code: 'INVALID_LONGITUDE_RANGE',
//     path: '/features/1/geometry/coordinates',
//     index: 1,
//     params: { value: 200 }
//   }],
//   warnings: []
// }

// Empty features array
validateGeoJson({ type: 'FeatureCollection', features: [] })
// { valid: false, errors: [{ code: 'INVALID_FEATURES_ARRAY' }], warnings: [] }

// CRS validated when present
validateGeoJson({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }],
  crs: { type: 'link', properties: { href: '' } }
})
// { valid: false, errors: [{ code: 'INVALID_CRS_LINK', path: '/crs' }], warnings: [] }
```