---
title: validate
description: Validate GeoJSON objects and report errors and warnings.
---

# validate

The validation module exposes `validateGeoJson()` to validate GeoJSON geometries, Features, and FeatureCollections.

Validation results use stable codes from `VALIDATION_CODES` and can include errors, warnings, and statistics.

## validateGeoJson

### Signature

```js
validateGeoJson (geoJson, options = {})
```

### Description

Validates a GeoJSON geometry, `Feature`, or `FeatureCollection`.

The coordinate reference system is resolved from the root `crs` member. When no CRS is declared, WGS84 is assumed.

The root CRS applies to the entire GeoJSON document. Nested CRS declarations are not supported.

Validation adapts automatically to the root CRS:

* CRS-independent checks are always applied;
* geodesic checks are applied only when the root CRS is equivalent to WGS84.

### Parameters

| Name                | Type     | Required | Description                                                                                                           |
| ------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `geoJson`           | `object` | yes      | GeoJSON object to validate                                                                                            |
| `options`           | `object` | no       | Validation options                                                                                                    |
| `options.precision` | `number` | no       | Maximum recommended precision for geodesic longitude/latitude coordinates. Defaults to `DEFAULT_COORDINATE_PRECISION` |

### Returns

```js
{
  valid: boolean,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  statistics: {
    Feature: number,
    FeatureCollection: number,
    geometries: {
      [geometryType]: number
    }
  }
}
```

A validation issue has the following shape:

```js
{
  code: string,
  path?: string,
  index?: number,
  params?: object
}
```

Paths use a JSON Pointer-like notation such as `/coordinates/0`, `/features/2/geometry`, 
or `/bbox`.

### Throws

Throws if `geoJson` is not a non-empty object.

## Coordinate reference systems

When no root `crs` member is present, WGS84 is assumed.

A named CRS is supported when its projection is registered. EPSG URN names are normalized 
before lookup.

CRS objects using the `link` form are rejected with `UNSUPPORTED_LINK_CRS`.

Only the root GeoJSON object may declare a CRS. A nested `crs` member produces 
`UNSUPPORTED_NESTED_CRS`.

External CRS resources are never fetched.

## Validation rules

### CRS-independent checks

The following checks are applied for every supported CRS:

* coordinate tuple structure;
* finite numeric coordinate values;
* altitude validity;
* minimum coordinate counts;
* geometry structure;
* ring closure;
* duplicate consecutive positions;
* bounding-box structure and coordinate ordering.

### Geodesic checks

When the root CRS is equivalent to WGS84, additional checks are enabled:

* longitude range `[-180, 180]`;
* latitude range `[-90, 90]`;
* excessive longitude/latitude precision;
* antimeridian crossings;
* polygon winding order;
* ring self-intersections;
* hole/shell intersections.

These checks rely on geographic or n-vector calculations and are skipped for projected CRS.

## Errors

| Code                                    | `params`               | Cause                                                                  |
| --------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `INVALID_POSITION_LENGTH`               | —                      | Position is not an array of 2 or 3 values                              |
| `INVALID_POSITION_COORDINATES`          | —                      | Horizontal coordinates are not finite numbers                          |
| `INVALID_LONGITUDE_RANGE`               | `{ value }`            | Longitude is outside `[-180, 180]` during geodesic validation          |
| `INVALID_LATITUDE_RANGE`                | `{ value }`            | Latitude is outside `[-90, 90]` during geodesic validation             |
| `INVALID_ALTITUDE`                      | —                      | Altitude is not a finite number                                        |
| `INVALID_BBOX_LENGTH`                   | —                      | Bounding box does not contain 4 or 6 values                            |
| `INVALID_BBOX_LONGITUDE_ORDER`          | `{ west, east }`       | First-axis minimum exceeds maximum for a projected CRS                 |
| `INVALID_BBOX_LATITUDE_ORDER`           | `{ south, north }`     | Second-axis minimum exceeds maximum                                    |
| `INVALID_BBOX_ALTITUDE_ORDER`           | `{ minAlt, maxAlt }`   | Minimum altitude exceeds maximum altitude                              |
| `INVALID_CRS_OBJECT`                    | —                      | `crs` is not a plain object                                            |
| `INVALID_CRS_TYPE`                      | `{ type }`             | CRS type is neither `name` nor `link`                                  |
| `INVALID_CRS_NAME`                      | —                      | Missing or empty `properties.name`                                     |
| `INVALID_CRS_LINK`                      | —                      | Missing or empty `properties.href`                                     |
| `UNSUPPORTED_CRS`                       | `{ name }`             | Named CRS does not resolve to a registered projection                  |
| `UNSUPPORTED_LINK_CRS`                  | —                      | CRS is declared using the unsupported `link` form                      |
| `UNSUPPORTED_NESTED_CRS`                | —                      | A CRS is declared below the root GeoJSON object                        |
| `INVALID_GEOMETRY`                      | —                      | Geometry is not a non-empty object                                     |
| `INVALID_GEOMETRY_TYPE`                 | `{ type }`             | Unknown geometry type                                                  |
| `INVALID_COORDINATES_LENGTH`            | `{ minimumLength }`    | Coordinates array is shorter than required                             |
| `INVALID_MULTI_LINESTRING_COORDINATES`  | —                      | `MultiLineString.coordinates` is empty or invalid                      |
| `INVALID_POLYGON_COORDINATES`           | —                      | `Polygon.coordinates` is empty or invalid                              |
| `INVALID_MULTIPOLYGON_COORDINATES`      | —                      | `MultiPolygon.coordinates` is empty or invalid                         |
| `INVALID_GEOMETRYCOLLECTION_GEOMETRIES` | —                      | `GeometryCollection.geometries` is empty or invalid                    |
| `RING_NOT_CLOSED`                       | —                      | LinearRing is not closed                                               |
| `INVALID_WINDING_ORDER`                 | `{ expected, actual }` | Polygon ring winding order is incorrect during geodesic validation     |
| `SELF_INTERSECTION`                     | `{ count }`            | Polygon ring self-intersects during geodesic validation                |
| `HOLE_INTERSECTS_SHELL`                 | —                      | A polygon hole intersects its exterior ring during geodesic validation |
| `UNKNOWN_TYPE`                          | `{ type }`             | Unknown GeoJSON type                                                   |
| `INVALID_FEATURES_ARRAY`                | —                      | `FeatureCollection.features` is not an array                           |
| `EMPTY_OBJECT`                          | —                      | Nested feature object is empty                                         |

## Warnings

| Code                            | `params`             | Cause                                                                 |
| ------------------------------- | -------------------- | --------------------------------------------------------------------- |
| `EXCESSIVE_LONGITUDE_PRECISION` | `{ precision, max }` | Longitude exceeds the configured precision during geodesic validation |
| `EXCESSIVE_LATITUDE_PRECISION`  | `{ precision, max }` | Latitude exceeds the configured precision during geodesic validation  |
| `BBOX_ANTIMERIDIAN_CROSSING`    | `{ west, east }`     | WGS84 bounding box crosses the antimeridian                           |
| `ANTIMERIDIAN_CROSSING`         | —                    | WGS84 segment crosses the antimeridian                                |
| `DUPLICATE_POSITION`            | —                    | Consecutive positions are equal at the configured precision           |
| `MISSING_GEOMETRY`              | —                    | A `Feature` has no geometry                                           |

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

`VALIDATION_CODES` is generated from the validation keys defined in the built-in English 
locale and therefore stays synchronized with the localization catalog.

## Examples

```js
validateGeoJson({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.3522, 48.8566]
  },
  properties: {}
})
// valid
```

```js
validateGeoJson({
  type: 'Point',
  coordinates: [700000, 6600000],
  crs: {
    type: 'name',
    properties: { name: 'EPSG:2154' }
  }
})
// valid when EPSG:2154 is registered
```

```js
validateGeoJson({
  type: 'FeatureCollection',
  features: []
})
// valid
```

```js
validateGeoJson({
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
    properties: {},
    crs: {
      type: 'name',
      properties: { name: 'EPSG:4326' }
    }
  }]
})
// errors include UNSUPPORTED_NESTED_CRS at /features/0/crs
```
