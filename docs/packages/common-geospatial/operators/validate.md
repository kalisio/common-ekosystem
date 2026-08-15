---
title: validate
description: Validation of GeoJSON objects, geometries, positions, bounding boxes and CRS.
---

# validate

Validation functions return structured results based on stable validation codes.

The common result shape is:

```js
{
  valid: boolean,
  errors: {
    code: string,
    path?: string,
    index?: number,
    params?: object
  }[],
  warnings: {
    code: string,
    path?: string,
    index?: number,
    params?: object
  }[]
}
```

`validateGeometry()` and `validateGeoJson()` also provide statistics:

```js
{
  statistics: {
    Feature: number,
    FeatureCollection: number,
    geometries: {
      [geometryType]: number
    }
  }
}
```

Errors indicate structural or semantic invalidity. Warnings are non-blocking observations such as excessive
coordinate precision, antimeridian crossings, duplicate consecutive positions, or missing feature geometry.

Every error and warning carries a stable `code` from `VALIDATION_CODES` instead of a human-readable message.
Optional `params` provide dynamic values that applications can use when formatting or localizing a message.

Paths use a JSON Pointer-like notation such as `/coordinates/0`, `/features/2/geometry`, or `/bbox`.

## Errors and warnings reference

### Errors

| Emitted by | Code | `params` | Cause |
|---|---|---|---|
| `validatePosition` | `INVALID_POSITION` | — | Coordinates are not a well-formed tuple of 2–3 finite numbers |
| `validatePosition` | `INVALID_LONGITUDE_RANGE` | `{ value }` | Longitude is outside `[-180, 180]` |
| `validatePosition` | `INVALID_LATITUDE_RANGE` | `{ value }` | Latitude is outside `[-90, 90]` |
| `validateBBox` | `INVALID_BBOX_LENGTH` | — | Bounding box does not contain 4 or 6 values |
| `validateBBox` | `INVALID_BBOX_LATITUDE_ORDER` | `{ south, north }` | South latitude exceeds north latitude |
| `validateBBox` | `INVALID_BBOX_ALTITUDE_ORDER` | `{ minAlt, maxAlt }` | Minimum altitude exceeds maximum altitude |
| `validateCRS` | `INVALID_CRS_OBJECT` | — | `crs` is not a plain object |
| `validateCRS` | `INVALID_CRS_TYPE` | `{ type }` | CRS type is neither `name` nor `link` |
| `validateCRS` | `INVALID_CRS_NAME` | — | Missing or empty `properties.name` |
| `validateCRS` | `INVALID_CRS_LINK` | — | Missing or empty `properties.href` |
| `validateCRS` | `UNSUPPORTED_CRS` | `{ name }` | Named CRS is not a supported WGS84 CRS |
| `validateGeometry` | `INVALID_GEOMETRY` | — | Geometry is not a non-empty object |
| `validateGeometry` | `INVALID_GEOMETRY_TYPE` | `{ type }` | Unknown geometry type |
| `validateGeometry` | `INVALID_COORDINATES_LENGTH` | `{ minimumLength }` | Coordinates array is shorter than required |
| `validateGeometry` | `INVALID_MULTI_LINESTRING_COORDINATES` | — | `MultiLineString.coordinates` is empty or invalid |
| `validateGeometry` | `INVALID_POLYGON_COORDINATES` | — | `Polygon.coordinates` is empty or invalid |
| `validateGeometry` | `INVALID_MULTIPOLYGON_COORDINATES` | — | `MultiPolygon.coordinates` is empty or invalid |
| `validateGeometry` | `INVALID_GEOMETRYCOLLECTION_GEOMETRIES` | — | `GeometryCollection.geometries` is empty or invalid |
| `validateGeometry` | `RING_NOT_CLOSED` | — | LinearRing is not closed |
| `validateGeometry` | `INVALID_WINDING_ORDER` | `{ expected, actual }` | Polygon ring winding order is incorrect |
| `validateGeometry` | `SELF_INTERSECTION` | `{ count }` | Polygon ring self-intersects |
| `validateGeometry` | `HOLE_INTERSECTS_SHELL` | — | A polygon hole intersects its exterior ring |
| `validateGeoJson` | `UNKNOWN_TYPE` | `{ type }` | Unknown GeoJSON type |
| `validateGeoJson` | `INVALID_FEATURES_ARRAY` | — | `FeatureCollection.features` is empty or invalid |
| `validateGeoJson` | `EMPTY_OBJECT` | — | Nested feature object is empty |

### Warnings

| Emitted by | Code | `params` | Cause |
|---|---|---|---|
| `validatePosition` | `EXCESSIVE_LONGITUDE_PRECISION` | `{ precision, max }` | Longitude exceeds the configured precision |
| `validatePosition` | `EXCESSIVE_LATITUDE_PRECISION` | `{ precision, max }` | Latitude exceeds the configured precision |
| `validateBBox` | `BBOX_ANTIMERIDIAN_CROSSING` | `{ west, east }` | Bounding box crosses the antimeridian (`west > east`) |
| `validateGeometry` | `ANTIMERIDIAN_CROSSING` | — | Segment crosses the antimeridian |
| `validateGeometry` | `DUPLICATE_POSITION` | — | Consecutive positions are equal at the configured precision |
| `validateGeoJson` | `MISSING_GEOMETRY` | — | A `Feature` has no geometry |

## Localized messages

Validation results intentionally contain stable codes instead of localized messages.

Applications can translate these codes using the localization module:

```js
import {
  getActiveLocales,
  getMessages
} from '@kalisio/common-geospatial'

function getValidationMessage (code) {
  for (const locale of getActiveLocales()) {
    const message = getMessages(locale).VALIDATION[code]
    if (message) return message
  }
  return code
}
```

```js
const result = validateGeometry(geometry)

for (const error of result.errors) {
  console.log(getValidationMessage(error.code))
}
```

Using stable codes allows applications to:

- display messages in any supported language;
- react programmatically to specific validation issues;
- customize translations without changing validation logic.

::: tip
`VALIDATION_CODES` is generated from the validation keys defined in the built-in English locale and
therefore stays synchronized with the localization catalog.
:::

## Behavioral notes

### Coordinate precision

Coordinate precision is configurable.

By default, validation uses `DEFAULT_COORDINATE_PRECISION`. A different precision can be provided
to `validatePosition()`, `validateBBox()`, `validateGeometry()`, or through `options.precision` in
`validateGeoJson()`.

Longitude and latitude remain valid when they exceed the configured precision, but a warning is emitted.

```js
validatePosition(
  [2.35221234, 48.8566],
  '',
  6
)

// {
//   valid: true,
//   errors: [],
//   warnings: [{
//     code: 'EXCESSIVE_LONGITUDE_PRECISION',
//     path: '',
//     params: { precision: 8, max: 6 }
//   }]
// }
```

### Duplicate positions

Two consecutive positions are considered duplicates when they are equal according to `isSamePosition()`
at the configured precision.

This applies to:

- `LineString`;
- each line of a `MultiLineString`;
- each ring of a `Polygon`;
- each ring of a `MultiPolygon`.

It does not apply to `MultiPoint`, because its positions have no adjacency relationship.

Duplicate positions generate a warning.

```js
validateGeometry({
  type: 'LineString',
  coordinates: [[0, 0], [1, 1], [1, 1], [2, 2]]
})

// {
//   valid: true,
//   errors: [],
//   warnings: [{
//     code: 'DUPLICATE_POSITION',
//     path: '/coordinates/1'
//   }],
//   ...
// }
```

On polygon rings, a consecutive duplicate also creates a zero-length edge and may therefore contribute
to a `SELF_INTERSECTION` error.

### Winding order

Polygon rings must follow the GeoJSON winding convention:

- exterior rings: counter-clockwise;
- interior rings: clockwise.

An incorrect winding order produces an `INVALID_WINDING_ORDER` error.

```js
validateGeometry({
  type: 'Polygon',
  coordinates: [
    [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
  ]
})

// {
//   valid: false,
//   errors: [{
//     code: 'INVALID_WINDING_ORDER',
//     path: '/coordinates/0',
//     params: {
//       expected: 'counter-clockwise',
//       actual: 'clockwise'
//     }
//   }],
//   warnings: [],
//   ...
// }
```

Winding order is computed on the sphere.

### Antimeridian crossings

A segment is considered to cross the antimeridian when the absolute difference between two consecutive
longitudes exceeds 180 degrees.

`validateGeometry()` emits an `ANTIMERIDIAN_CROSSING` warning for such segments.

```js
validateGeometry({
  type: 'LineString',
  coordinates: [[170, 0], [-170, 0]]
})
```

A bounding box with `west > east` produces a `BBOX_ANTIMERIDIAN_CROSSING` warning.

```js
validateBBox([170, -20, -170, 20])
```

### Self-intersections

Self-intersections are checked on `Polygon` and `MultiPolygon` rings.

A ring self-intersects when non-adjacent edges cross. Intersections are evaluated on the sphere.

```js
validateGeometry({
  type: 'Polygon',
  coordinates: [
    [[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]
  ]
})

// errors include:
// {
//   code: 'SELF_INTERSECTION',
//   path: '/coordinates/0',
//   params: { count: 1 }
// }
```

### Hole and shell intersections

For polygons containing holes, each interior ring is checked against the exterior ring.

An intersection produces a `HOLE_INTERSECTS_SHELL` error.

### CRS support

Although the `crs` property was removed from RFC 7946, it is still encountered in legacy datasets and
GIS exports.

The library validates both `name` and `link` CRS objects.

For named CRS objects, only WGS84 geographic coordinate reference systems are supported. The referenced
projection must resolve to a registered WGS84 projection such as `EPSG:4326`, `CRS:84`, or another
equivalent alias.

Other named CRS values produce an `UNSUPPORTED_CRS` error.

For `link` CRS objects, only the object structure is validated; the referenced resource is not resolved.

## validatePosition

### Signature

```js
validatePosition (coordinates, path = '', precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Validates a GeoJSON position.

The function checks:

- that the position contains 2 or 3 numeric coordinates;
- longitude range `[-180, 180]`;
- latitude range `[-90, 90]`;
- altitude type when present;
- longitude and latitude precision.

Exceeding the configured precision produces a warning but does not invalidate the position.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `coordinates` | `number[]` | yes | `[longitude, latitude]` or `[longitude, latitude, altitude]` |
| `path` | `string` | no | Base path for errors and warnings (default: `''`) |
| `precision` | `number` | no | Maximum recommended decimal precision (default: `DEFAULT_COORDINATE_PRECISION`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Examples

```js
validatePosition([2.3522, 48.8566])
// { valid: true, errors: [], warnings: [] }

validatePosition([200, 48.8566])
// {
//   valid: false,
//   errors: [{
//     code: 'INVALID_LONGITUDE_RANGE',
//     path: '',
//     params: { value: 200 }
//   }],
//   warnings: []
// }

validatePosition([2.35221234, 48.8566], '', 6)
// {
//   valid: true,
//   errors: [],
//   warnings: [{
//     code: 'EXCESSIVE_LONGITUDE_PRECISION',
//     path: '',
//     params: { precision: 8, max: 6 }
//   }]
// }
```

## validateBBox

### Signature

```js
validateBBox (bbox, path = '', precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Validates a GeoJSON bounding box.

Both 2D and 3D bounding boxes are supported:

```js
[west, south, east, north]
[west, south, minAlt, east, north, maxAlt]
```

The minimum and maximum corners are validated as positions using the configured precision.

The function also checks:

- south latitude does not exceed north latitude;
- minimum altitude does not exceed maximum altitude for 3D boxes;
- antimeridian crossing (`west > east`), reported as a warning.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `bbox` | `number[]` | yes | A 2D or 3D GeoJSON bounding box |
| `path` | `string` | no | Base path for errors and warnings (default: `''`) |
| `precision` | `number` | no | Maximum recommended coordinate precision (default: `DEFAULT_COORDINATE_PRECISION`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Examples

```js
validateBBox([-10, -20, 10, 20])
// { valid: true, errors: [], warnings: [] }

validateBBox([-10, 30, 10, 20])
// {
//   valid: false,
//   errors: [{
//     code: 'INVALID_BBOX_LATITUDE_ORDER',
//     path: '',
//     params: { south: 30, north: 20 }
//   }],
//   warnings: []
// }

validateBBox([170, -20, -170, 20])
// {
//   valid: true,
//   errors: [],
//   warnings: [{
//     code: 'BBOX_ANTIMERIDIAN_CROSSING',
//     path: '',
//     params: { west: 170, east: -170 }
//   }]
// }
```

## validateCRS

### Signature

```js
validateCRS (crs, path = '')
```

### Description

Validates a GeoJSON Coordinate Reference System (CRS) object.

Supported structures are:

- `name`, with a non-empty `properties.name`;
- `link`, with a non-empty `properties.href`.

Only WGS84 geographic coordinate reference systems are supported for named CRS objects.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `crs` | `object` | yes | GeoJSON CRS object |
| `path` | `string` | no | Base path for errors and warnings (default: `''`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result |

### Examples

```js
validateCRS({
  type: 'name',
  properties: {
    name: 'CRS:84'
  }
})
// { valid: true, errors: [], warnings: [] }

validateCRS({
  type: 'name',
  properties: {
    name: 'EPSG:2154'
  }
})
// {
//   valid: false,
//   errors: [{
//     code: 'UNSUPPORTED_CRS',
//     path: '',
//     params: { name: 'EPSG:2154' }
//   }],
//   warnings: []
// }

validateCRS({
  type: 'link',
  properties: {
    href: 'https://example.com/crs'
  }
})
// { valid: true, errors: [], warnings: [] }
```

## validateGeometry

### Signature

```js
validateGeometry (geometry, path = '', precision = DEFAULT_COORDINATE_PRECISION)
```

### Description

Validates a GeoJSON geometry.

The function dispatches validation according to `geometry.type` and supports:

- `Point`;
- `MultiPoint`;
- `LineString`;
- `MultiLineString`;
- `Polygon`;
- `MultiPolygon`;
- `GeometryCollection`.

Depending on the geometry type, validation includes:

- coordinate validation;
- minimum coordinate counts;
- duplicate consecutive positions;
- antimeridian crossings;
- LinearRing closure;
- winding order;
- ring self-intersections;
- hole/shell intersections;
- optional bounding-box validation.

`GeometryCollection` members are validated recursively.

The result includes geometry statistics.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geometry` | `object` | yes | GeoJSON geometry |
| `path` | `string` | no | Base path for errors and warnings (default: `''`) |
| `precision` | `number` | no | Coordinate precision used by precision-sensitive checks (default: `DEFAULT_COORDINATE_PRECISION`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result including `statistics` |

### Examples

```js
validateGeometry({
  type: 'Point',
  coordinates: [2.3522, 48.8566]
})

// {
//   valid: true,
//   errors: [],
//   warnings: [],
//   statistics: {
//     geometries: { Point: 1 }
//   }
// }
```

```js
validateGeometry({
  type: 'Polygon',
  coordinates: [
    [[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]
  ]
})

// valid: false
// errors include SELF_INTERSECTION
```

## validateGeoJson

### Signature

```js
validateGeoJson (geoJson, options = {})
```

### Description

Validates any GeoJSON object:

- a geometry;
- a `Feature`;
- a `FeatureCollection`.

Plain geometries are delegated to `validateGeometry()`.

For a `Feature`, the geometry is validated when present. A missing or `null` geometry produces a `MISSING_GEOMETRY` warning.

For a `FeatureCollection`, features are validated recursively.

Optional `bbox` and `crs` properties are validated where supported.

The result includes statistics for features, feature collections, and geometry types.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `geoJson` | `object` | yes | GeoJSON object |
| `options` | `object` | no | Validation options |
| `options.precision` | `number` | no | Coordinate precision propagated to position, bbox, and geometry validation (default: `DEFAULT_COORDINATE_PRECISION`) |

### Returns

| Type | Description |
|------|-------------|
| `object` | Validation result including `statistics` |

### Throws

Throws if `geoJson` is not a non-empty object.

### Examples

```js
validateGeoJson({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.3522, 48.8566]
  },
  properties: {}
})

// {
//   valid: true,
//   errors: [],
//   warnings: [],
//   statistics: {
//     Feature: 1,
//     FeatureCollection: 0,
//     geometries: { Point: 1 }
//   }
// }
```

```js
validateGeoJson(
  {
    type: 'Point',
    coordinates: [2.35221234, 48.8566]
  },
  {
    precision: 6
  }
)

// warnings include EXCESSIVE_LONGITUDE_PRECISION
```

```js
validateGeoJson({
  type: 'Feature',
  geometry: null,
  properties: {}
})

// {
//   valid: true,
//   errors: [],
//   warnings: [{
//     code: 'MISSING_GEOMETRY',
//     path: ''
//   }],
//   statistics: {
//     Feature: 1,
//     FeatureCollection: 0,
//     geometries: {}
//   }
// }
```
